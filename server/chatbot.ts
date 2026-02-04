import Anthropic from "@anthropic-ai/sdk";
import { getDb } from "./db";
import { customOrderInquiries, chatMessages } from "../drizzle/schema";
import { eq } from "drizzle-orm";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const SYSTEM_PROMPT = `You are a friendly and helpful custom order assistant for Fairytale Farms Bakery, a home bakery in Castalian Springs, Tennessee (Sumner County). Your job is to help customers place custom orders by gathering all necessary information and providing price estimates.

## About Fairytale Farms
- Online-only bakery serving Sumner County via DoorDash & Uber Eats
- All items are made to order with love and care
- Contact: fairytalefarms.net@gmail.com

## Menu & Pricing

### Custom Cakes
**Single-Tier Cakes:**
- 6-inch, 3-layer (serves 10-15): starting at $75 + tax
- 8-inch, 3-layer (serves up to 25): starting at $110 + tax

**Two-Tier Cakes:**
- 8-inch bottom + 6-inch top (serves up to 40): starting at $210 + tax
- 6-inch bottom + 4-inch top (serves up to 20): starting at $150 + tax

Includes vanilla or chocolate. Custom flavors, fillings, and detailed designs may increase pricing.

### Custom Sugar Cookies
- Decorated Sugar Cookies: $55 per dozen
- One cohesive theme per order. Hand-decorated and made to order.

### Mini Tin Cakes
- Chocolate, Vanilla Birthday Cake, or Strawberry Crunch: $5 each

### Brownies
- Simple Brownie (includes ganache): $4 each
- Turtle Brownie: $5 each
- S'mores Brownie: $5 each

### Classic Cookies (Non-Decorated)
- Chocolate Chip: $18 per dozen
- Chocolate Crinkle: $20 per dozen
- Sprinkle Sugar: $18 per dozen
- Pecan Sandies: $20 per dozen
- Mixed dozens: +$2

### Chocolate-Covered Strawberries (seasonal)
- Half dozen: $18
- Dozen: starting at $30

### Freeze-Dried Candy
- All varieties: $5 each (Skittles, Jolly Ranchers, Taffy, Caramel M&Ms, Airheads, Sprees, Fruit Chews, Milk Duds)

### Custom Portrait Pucks (Oreos)
- $8 per puck, 6-puck minimum ($48)
- Turn photos into edible art on chocolate-covered Oreos

## Your Tasks

1. **Greet warmly** and ask how you can help with their custom order.

2. **Gather order information** by asking about:
   - What type of item they want (cake, cookies, etc.)
   - Event date and type (birthday, wedding, anniversary, etc.)
   - Number of servings/quantity needed
   - Flavor preferences
   - Design/theme details (colors, characters, style)
   - Budget range (if they have one in mind)

3. **Provide price estimates** based on the menu above. Be clear that these are starting prices and complex designs may cost more.

4. **Collect contact information**:
   - Name
   - Email
   - Phone number

5. **Confirm all details** before submitting the order inquiry.

6. **After collecting all information**, let them know:
   - Their inquiry has been submitted
   - Someone will contact them within 24 hours to confirm the order and provide a final quote
   - A deposit will be required to confirm the order

## Guidelines
- Be warm, friendly, and enthusiastic about their event
- Ask one or two questions at a time, don't overwhelm them
- If they're unsure about something, offer suggestions based on their event type
- Always provide price estimates when discussing items
- For complex requests, explain that the final price may vary based on design complexity
- If asked about delivery, explain we serve Sumner County via DoorDash & Uber Eats
- Custom orders typically need 48-72 hours notice; larger orders may need more time
- For Valentine's Day 2026, order cutoff is February 12th

## Important
- Never make up prices not listed in the menu
- If asked about something not on the menu, politely explain what we do offer
- Keep responses concise but helpful
- Use emojis sparingly to add warmth 🎂🍪

When the customer has provided all necessary information (item type, event details, quantity, contact info), summarize the order and indicate you're submitting it for follow-up.`;

export const CHAT_LIMITS = {
  maxSessionIdLength: 100,
  maxMessageLength: 2000,
  maxHistoryMessages: 20,
  maxImagesPerSession: 5,
  maxImagesPerMessage: 5,
  maxImageBytes: 5 * 1024 * 1024,
  sessionTtlMs: 1000 * 60 * 60,
};

type SessionImageEntry = { images: string[]; updatedAt: number };
const sessionImages: Map<string, SessionImageEntry> = new Map();

type ChatRateLimitAction = "sendMessage" | "uploadImage";
type RateLimitState = { count: number; resetAt: number };

const RATE_LIMITS: Record<
  ChatRateLimitAction,
  { limit: number; windowMs: number }
> = {
  sendMessage: { limit: 12, windowMs: 60_000 },
  uploadImage: { limit: 5, windowMs: 60_000 },
};

const rateLimitState: Map<string, RateLimitState> = new Map();
const IMAGE_DATA_URL_PATTERN = /^data:(image\/(?:jpeg|png));base64,(.+)$/i;

export interface ChatRequest {
  sessionId: string;
  message: string;
  conversationHistory?: Array<{ role: "user" | "assistant"; content: string }>;
  imageUrls?: string[];
}

export interface ChatResponse {
  message: string;
  orderSubmitted?: boolean;
  orderDetails?: {
    inquiryNumber: string;
    customerName?: string;
    customerEmail?: string;
    eventDate?: string;
    eventType?: string;
    quantity?: string;
    estimatedPrice?: string;
  };
}

export async function processChat(request: ChatRequest): Promise<ChatResponse> {
  const {
    sessionId,
    message,
    conversationHistory = [],
    imageUrls = [],
  } = request;

  // Store images for this session if provided
  cleanupExpiredSessions();
  touchSession(sessionId);
  if (imageUrls.length > 0) {
    mergeSessionImages(sessionId, imageUrls);
  }

  // Store user message
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(chatMessages).values({
    sessionId,
    role: "user",
    content: message,
  });

  // Build messages array for Claude
  const trimmedHistory = conversationHistory.slice(
    -CHAT_LIMITS.maxHistoryMessages
  );

  const messages: Array<{ role: "user" | "assistant"; content: string }> = [
    ...trimmedHistory,
    { role: "user", content: message },
  ];

  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: messages,
    });

    const assistantMessage =
      response.content[0].type === "text" ? response.content[0].text : "";

    // Store assistant response
    await db.insert(chatMessages).values({
      sessionId,
      role: "assistant",
      content: assistantMessage,
    });

    // Check if order details are complete and should be submitted
    const orderSubmitted = await checkAndSubmitOrder(
      sessionId,
      [...conversationHistory, { role: "user", content: message }],
      assistantMessage
    );

    return {
      message: assistantMessage,
      ...orderSubmitted,
    };
  } catch (error) {
    console.error("Chatbot error:", error);
    throw new Error("Failed to process chat message");
  }
}

async function checkAndSubmitOrder(
  sessionId: string,
  conversationHistory: Array<{ role: "user" | "assistant"; content: string }>,
  latestResponse: string
): Promise<{
  orderSubmitted?: boolean;
  orderDetails?: ChatResponse["orderDetails"];
}> {
  // Check if the assistant's response indicates order submission
  const submissionIndicators = [
    "inquiry has been submitted",
    "order inquiry has been submitted",
    "submitting your order",
    "I've submitted your",
    "your inquiry is submitted",
    "contact you within 24 hours",
    "we'll be in touch within 24 hours",
    "will reach out within 24 hours",
    "get back to you within 24 hours",
  ];

  const shouldSubmit = submissionIndicators.some(indicator =>
    latestResponse.toLowerCase().includes(indicator.toLowerCase())
  );

  if (!shouldSubmit) {
    return {};
  }

  // Extract order details from conversation using Claude
  try {
    const extractionResponse = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      system: `Extract order details from this conversation. Return a JSON object with these fields (use null for missing info):
{
  "customerName": "string or null",
  "customerEmail": "string or null",
  "customerPhone": "string or null",
  "eventDate": "YYYY-MM-DD format or null",
  "eventType": "string or null",
  "quantity": "string description or null",
  "flavorPreferences": "string or null",
  "designTheme": "string or null",
  "budgetRange": "string or null",
  "estimatedPrice": "number or null",
  "estimateDetails": "string description of what's included or null"
}
Only return the JSON object, no other text.`,
      messages: [
        {
          role: "user",
          content: `Extract order details from this conversation:\n\n${conversationHistory
            .map(m => `${m.role.toUpperCase()}: ${m.content}`)
            .join("\n\n")}`,
        },
      ],
    });

    const extractedText =
      extractionResponse.content[0].type === "text"
        ? extractionResponse.content[0].text
        : "{}";

    let orderDetails;
    try {
      orderDetails = JSON.parse(extractedText);
    } catch {
      console.error("Failed to parse order details:", extractedText);
      orderDetails = {};
    }

    // Generate inquiry number
    const inquiryNumber = `INQ-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

    // Store the order inquiry
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Get any images attached during this session
    const attachedImages = getSessionImages(sessionId);

    await db.insert(customOrderInquiries).values({
      inquiryNumber,
      customerName: orderDetails.customerName,
      customerEmail: orderDetails.customerEmail,
      customerPhone: orderDetails.customerPhone,
      eventDate: orderDetails.eventDate
        ? new Date(orderDetails.eventDate)
        : null,
      eventType: orderDetails.eventType,
      quantity: orderDetails.quantity,
      flavorPreferences: orderDetails.flavorPreferences,
      designTheme: orderDetails.designTheme,
      budgetRange: orderDetails.budgetRange,
      estimatedPrice: orderDetails.estimatedPrice?.toString(),
      estimateDetails: orderDetails.estimateDetails,
      additionalNotes: `Session ID: ${sessionId}`,
      imageAttachments:
        attachedImages.length > 0 ? JSON.stringify(attachedImages) : null,
      status: "new",
    });

    clearSessionImages(sessionId);

    // Update chat messages to link to inquiry
    const [inquiry] = await db
      .select()
      .from(customOrderInquiries)
      .where(eq(customOrderInquiries.inquiryNumber, inquiryNumber));

    if (inquiry) {
      await db
        .update(chatMessages)
        .set({ inquiryId: inquiry.id })
        .where(eq(chatMessages.sessionId, sessionId));
    }

    // Send email notification
    await sendOrderNotificationEmail(inquiryNumber, orderDetails);

    return {
      orderSubmitted: true,
      orderDetails: {
        inquiryNumber,
        customerName: orderDetails.customerName,
        customerEmail: orderDetails.customerEmail,
        eventDate: orderDetails.eventDate,
        eventType: orderDetails.eventType,
        quantity: orderDetails.quantity,
        estimatedPrice: orderDetails.estimatedPrice?.toString(),
      },
    };
  } catch (error) {
    console.error("Error extracting/submitting order:", error);
    return {};
  }
}

async function sendOrderNotificationEmail(
  inquiryNumber: string,
  orderDetails: Record<string, unknown>
): Promise<void> {
  // Use the built-in notification API
  try {
    const notificationPayload = {
      to: "fairytalefarms.net@gmail.com",
      subject: `New Custom Order Inquiry: ${inquiryNumber}`,
      html: `
        <h2>New Custom Order Inquiry</h2>
        <p><strong>Inquiry Number:</strong> ${inquiryNumber}</p>
        <hr>
        <h3>Customer Information</h3>
        <p><strong>Name:</strong> ${orderDetails.customerName || "Not provided"}</p>
        <p><strong>Email:</strong> ${orderDetails.customerEmail || "Not provided"}</p>
        <p><strong>Phone:</strong> ${orderDetails.customerPhone || "Not provided"}</p>
        <hr>
        <h3>Order Details</h3>
        <p><strong>Event Date:</strong> ${orderDetails.eventDate || "Not provided"}</p>
        <p><strong>Event Type:</strong> ${orderDetails.eventType || "Not provided"}</p>
        <p><strong>Quantity:</strong> ${orderDetails.quantity || "Not provided"}</p>
        <p><strong>Flavor Preferences:</strong> ${orderDetails.flavorPreferences || "Not provided"}</p>
        <p><strong>Design/Theme:</strong> ${orderDetails.designTheme || "Not provided"}</p>
        <p><strong>Budget Range:</strong> ${orderDetails.budgetRange || "Not provided"}</p>
        <hr>
        <h3>Estimate Provided</h3>
        <p><strong>Estimated Price:</strong> ${orderDetails.estimatedPrice ? `$${orderDetails.estimatedPrice}` : "Not provided"}</p>
        <p><strong>Details:</strong> ${orderDetails.estimateDetails || "Not provided"}</p>
        <hr>
        <p><em>Please respond to this inquiry within 24 hours.</em></p>
      `,
    };

    // Log for now - email sending would use the notification API
    console.log("[Chatbot] Order notification:", notificationPayload);
  } catch (error) {
    console.error("Error sending notification email:", error);
  }
}

// Get conversation history for a session
export async function getConversationHistory(
  sessionId: string
): Promise<Array<{ role: "user" | "assistant"; content: string }>> {
  const db = await getDb();
  if (!db) return [];

  const messages = await db
    .select()
    .from(chatMessages)
    .where(eq(chatMessages.sessionId, sessionId))
    .orderBy(chatMessages.createdAt);

  return messages.map((m: { role: string; content: string }) => ({
    role: m.role as "user" | "assistant",
    content: m.content,
  }));
}

// Get all inquiries for admin
export async function getAllInquiries() {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(customOrderInquiries)
    .orderBy(customOrderInquiries.createdAt);
}

// Update inquiry status
export async function updateInquiryStatus(
  id: number,
  status:
    | "new"
    | "contacted"
    | "quoted"
    | "confirmed"
    | "completed"
    | "cancelled",
  adminNotes?: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(customOrderInquiries)
    .set({ status, adminNotes })
    .where(eq(customOrderInquiries.id, id));
}

function cleanupExpiredSessions(now: number = Date.now()) {
  for (const [sessionId, entry] of Array.from(sessionImages.entries())) {
    if (now - entry.updatedAt > CHAT_LIMITS.sessionTtlMs) {
      sessionImages.delete(sessionId);
    }
  }
}

function cleanupExpiredRateLimits(now: number = Date.now()) {
  for (const [rateKey, state] of Array.from(rateLimitState.entries())) {
    if (state.resetAt <= now) {
      rateLimitState.delete(rateKey);
    }
  }
}

function getSessionEntry(sessionId: string): SessionImageEntry {
  const existing = sessionImages.get(sessionId);
  if (existing) {
    existing.updatedAt = Date.now();
    return existing;
  }
  const entry = { images: [], updatedAt: Date.now() };
  sessionImages.set(sessionId, entry);
  return entry;
}

function touchSession(sessionId: string) {
  getSessionEntry(sessionId);
}

export function mergeSessionImages(sessionId: string, imageUrls: string[]) {
  cleanupExpiredSessions();
  const entry = getSessionEntry(sessionId);
  const merged = new Set(entry.images);
  imageUrls.forEach(url => merged.add(url));
  if (merged.size > CHAT_LIMITS.maxImagesPerSession) {
    return false;
  }
  entry.images = Array.from(merged);
  entry.updatedAt = Date.now();
  return true;
}

export function clearSessionImages(sessionId: string) {
  sessionImages.delete(sessionId);
}

export function parseImageData(imageData: string): {
  mimeType: string;
  byteLength: number;
} | null {
  const match = imageData.match(IMAGE_DATA_URL_PATTERN);
  if (!match) return null;
  const mimeType = match[1].toLowerCase();
  const base64Payload = match[2];
  if (!base64Payload) return null;
  const padding = base64Payload.endsWith("==")
    ? 2
    : base64Payload.endsWith("=")
      ? 1
      : 0;
  const byteLength = Math.max(
    0,
    Math.floor((base64Payload.length * 3) / 4) - padding
  );
  return { mimeType, byteLength };
}

export function validateImagePayload(imageData: string):
  | {
      ok: true;
      mimeType: string;
      byteLength: number;
    }
  | {
      ok: false;
      code: "BAD_REQUEST" | "PAYLOAD_TOO_LARGE";
      message: string;
    } {
  const parsed = parseImageData(imageData);
  if (!parsed) {
    return {
      ok: false,
      code: "BAD_REQUEST",
      message: "Invalid image data. Please upload a JPG or PNG file.",
    };
  }

  if (parsed.byteLength > CHAT_LIMITS.maxImageBytes) {
    return {
      ok: false,
      code: "PAYLOAD_TOO_LARGE",
      message: `Image must be smaller than ${Math.floor(CHAT_LIMITS.maxImageBytes / (1024 * 1024))}MB.`,
    };
  }

  return { ok: true, mimeType: parsed.mimeType, byteLength: parsed.byteLength };
}

export function checkChatRateLimit(
  action: ChatRateLimitAction,
  key: string
): {
  allowed: boolean;
  retryAfterMs?: number;
} {
  cleanupExpiredRateLimits();
  const config = RATE_LIMITS[action];
  const now = Date.now();
  const rateKey = `${action}:${key}`;
  const current = rateLimitState.get(rateKey);

  if (!current || current.resetAt <= now) {
    rateLimitState.set(rateKey, { count: 1, resetAt: now + config.windowMs });
    return { allowed: true };
  }

  if (current.count >= config.limit) {
    return { allowed: false, retryAfterMs: current.resetAt - now };
  }

  current.count += 1;
  return { allowed: true };
}

export async function uploadImage(
  sessionId: string,
  imageData: string,
  fileName: string
): Promise<{ url: string }> {
  cleanupExpiredSessions();
  const added = mergeSessionImages(sessionId, [imageData]);
  if (!added) {
    throw new Error("Image limit reached for this session");
  }

  return { url: imageData };
}

// Get images for a session
export function getSessionImages(sessionId: string): string[] {
  cleanupExpiredSessions();
  return sessionImages.get(sessionId)?.images ?? [];
}

// Store images with an inquiry
export async function attachImagesToInquiry(
  inquiryId: number,
  imageUrls: string[]
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(customOrderInquiries)
    .set({ imageAttachments: JSON.stringify(imageUrls) })
    .where(eq(customOrderInquiries.id, inquiryId));
}

// Get conversation history for an inquiry by inquiry ID
export async function getInquiryConversation(inquiryId: number): Promise<
  Array<{
    id: number;
    role: "user" | "assistant";
    content: string;
    createdAt: Date;
  }>
> {
  const db = await getDb();
  if (!db) return [];

  const messages = await db
    .select()
    .from(chatMessages)
    .where(eq(chatMessages.inquiryId, inquiryId))
    .orderBy(chatMessages.createdAt);

  return messages.map(m => ({
    id: m.id,
    role: m.role as "user" | "assistant",
    content: m.content,
    createdAt: m.createdAt,
  }));
}

// Get analytics data for inquiries
export async function getInquiryAnalytics() {
  const db = await getDb();
  if (!db)
    return {
      totalInquiries: 0,
      byStatus: {},
      byDay: [],
      conversionRate: 0,
      avgResponseTime: 0,
      overdueCount: 0,
    };

  const inquiries = await db
    .select()
    .from(customOrderInquiries)
    .orderBy(customOrderInquiries.createdAt);

  // Calculate metrics
  const totalInquiries = inquiries.length;

  // Count by status
  const byStatus: Record<string, number> = {};
  inquiries.forEach(inq => {
    byStatus[inq.status] = (byStatus[inq.status] || 0) + 1;
  });

  // Group by day (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const byDay: { date: string; count: number }[] = [];
  const dayMap: Record<string, number> = {};

  inquiries.forEach(inq => {
    const date = new Date(inq.createdAt).toISOString().split("T")[0];
    if (new Date(inq.createdAt) >= thirtyDaysAgo) {
      dayMap[date] = (dayMap[date] || 0) + 1;
    }
  });

  // Fill in missing days
  for (let i = 0; i < 30; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    byDay.unshift({ date: dateStr, count: dayMap[dateStr] || 0 });
  }

  // Conversion rate (confirmed + completed / total)
  const converted = (byStatus["confirmed"] || 0) + (byStatus["completed"] || 0);
  const conversionRate =
    totalInquiries > 0 ? Math.round((converted / totalInquiries) * 100) : 0;

  // Count overdue (new status and older than 24 hours)
  const twentyFourHoursAgo = new Date();
  twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

  const overdueCount = inquiries.filter(
    inq => inq.status === "new" && new Date(inq.createdAt) < twentyFourHoursAgo
  ).length;

  return {
    totalInquiries,
    byStatus,
    byDay,
    conversionRate,
    avgResponseTime: 0, // Would need more data to calculate
    overdueCount,
  };
}

// Bulk update inquiry statuses
export async function bulkUpdateInquiryStatus(
  ids: number[],
  status:
    | "new"
    | "contacted"
    | "quoted"
    | "confirmed"
    | "completed"
    | "cancelled"
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  for (const id of ids) {
    await db
      .update(customOrderInquiries)
      .set({ status })
      .where(eq(customOrderInquiries.id, id));
  }

  return { updated: ids.length };
}

// Get overdue inquiries (new status, older than 24 hours)
export async function getOverdueInquiries() {
  const db = await getDb();
  if (!db) return [];

  const twentyFourHoursAgo = new Date();
  twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

  const inquiries = await db
    .select()
    .from(customOrderInquiries)
    .orderBy(customOrderInquiries.createdAt);

  return inquiries.filter(
    inq => inq.status === "new" && new Date(inq.createdAt) < twentyFourHoursAgo
  );
}
