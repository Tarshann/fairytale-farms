/**
 * cron.ts
 * AI Automation Engine — five scheduled workflows:
 *
 *  1. Demand Forecasting       — every 6 hours
 *  2. Abandoned Cart Recovery  — every hour
 *  3. Review Moderation        — every 30 minutes
 *  4. Dynamic Pricing          — every 24 hours
 *  5. Marketing Campaigns      — every 24 hours (Mon/Wed/Fri)
 *
 * Each job is self-contained, idempotent, and fails gracefully.
 */

import * as db from "./db";
import {
  sendAbandonedCartEmail,
  sendReviewRequestEmail,
} from "./_core/email";
import { notifyOwner } from "./_core/notification";
import { ENV } from "./_core/env";
import { tracksInventory, remainingStock } from "../shared/inventory";
import OpenAI from "openai";

// ─── OpenAI Client ────────────────────────────────────────────────────────────

function getAIClient(): OpenAI | null {
  const apiKey = process.env.OPENAI_API_KEY || ENV.forgeApiKey;
  if (!apiKey) return null;
  return new OpenAI({
    apiKey,
    baseURL: process.env.BUILT_IN_FORGE_API_URL || undefined,
  });
}

async function callAI(
  systemPrompt: string,
  userPrompt: string,
  model: string = "gpt-4.1-mini"
): Promise<string | null> {
  const client = getAIClient();
  if (!client) {
    console.warn("[AI] No API key configured — skipping AI call.");
    return null;
  }
  try {
    const response = await client.chat.completions.create({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 1200,
    });
    return response.choices[0]?.message?.content?.trim() ?? null;
  } catch (err) {
    console.error("[AI] API call failed:", err);
    return null;
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function schedule(label: string, intervalMs: number, fn: () => Promise<void>) {
  const run = async () => {
    try {
      await fn();
    } catch (err) {
      console.error(`[Cron:${label}] Unhandled error:`, err);
    }
  };
  // Stagger initial runs by 10s each to avoid thundering herd at startup
  const staggerMs = Math.random() * 30_000;
  setTimeout(() => {
    run();
    setInterval(run, intervalMs);
  }, staggerMs);
  console.log(`[Cron:${label}] Scheduled every ${Math.round(intervalMs / 60_000)} min`);
}

// ─── 1. Demand Forecasting ────────────────────────────────────────────────────

async function runDemandForecast() {
  console.log("[Cron:DemandForecast] Running...");

  const velocity = await db.getOrderVelocityByProduct(30);
  if (!velocity.length) return;

  const allProducts = await db.getAllProductsAdmin();
  const productMap = new Map(allProducts.map(p => [p.id, p]));

  for (const item of velocity) {
    if (!item.productId) continue;
    const product = productMap.get(item.productId);
    if (!product || !tracksInventory(product)) continue;

    const remaining = remainingStock(product) ?? 0;
    const dailyVelocity = Number(item.totalQuantity) / 30;
    const daysRemaining = remaining / Math.max(dailyVelocity, 0.01);

    // Alert if < 7 days of stock remaining
    if (daysRemaining < 7 && remaining >= 0) {
      const alreadyAlerted = await db.hasUnresolvedAlertForProduct(product.id);
      if (!alreadyAlerted) {
        await db.createLowStockAlert({
          productId: product.id,
          currentStock: remaining,
          forecastedDemand: Math.round(dailyVelocity * 14),
        });

        await notifyOwner({
          title: `⚠️ Low Stock Alert: ${product.name}`,
          content: `${product.name} has ~${remaining} units remaining.\nAt current velocity (${dailyVelocity.toFixed(1)}/day), stock runs out in ~${Math.round(daysRemaining)} days.\nForecasted demand (14 days): ${Math.round(dailyVelocity * 14)} units.`,
        }).catch(() => {});

        console.log(`[Cron:DemandForecast] Low stock alert created for: ${product.name}`);
      }
    }
  }

  console.log("[Cron:DemandForecast] Complete.");
}

// ─── 2. Abandoned Cart Recovery ───────────────────────────────────────────────

async function runAbandonedCartRecovery() {
  console.log("[Cron:AbandonedCart] Running...");

  // Target carts abandoned for 1–24 hours with no recovery email sent
  const cutoff = new Date(Date.now() - 60 * 60_000); // 1 hour ago
  const carts = await db.getAbandonedCartsForRecovery(cutoff);

  if (!carts.length) {
    console.log("[Cron:AbandonedCart] No carts to recover.");
    return;
  }

  let sent = 0;
  for (const cart of carts) {
    try {
      let items: Array<{ name: string; quantity: number; price: string }> = [];
      let cartTotal = "0.00";

      try {
        const parsed = JSON.parse(cart.cartContents) as Array<{
          name: string;
          quantity: number;
          basePrice: string;
        }>;
        items = parsed.map(i => ({
          name: i.name,
          quantity: i.quantity,
          price: `$${(parseFloat(i.basePrice) * i.quantity).toFixed(2)}`,
        }));
        const total = parsed.reduce(
          (sum, i) => sum + parseFloat(i.basePrice) * i.quantity,
          0
        );
        cartTotal = total.toFixed(2);
      } catch {
        continue; // Skip malformed cart data
      }

      if (!items.length) continue;

      const emailSent = await sendAbandonedCartEmail({
        customerName: cart.userEmail.split("@")[0],
        customerEmail: cart.userEmail,
        items,
        cartTotal,
      });

      if (emailSent) {
        await db.markAbandonedCartEmailSent(cart.id);
        sent++;
      }
    } catch (err) {
      console.error(`[Cron:AbandonedCart] Error processing cart ${cart.id}:`, err);
    }
  }

  console.log(`[Cron:AbandonedCart] Sent ${sent} recovery emails.`);
}

// ─── 3. Review Moderation (AI Sentiment Analysis) ────────────────────────────

async function runReviewModeration() {
  console.log("[Cron:ReviewModeration] Running...");

  const pendingReviews = await db.getPendingReviews();
  if (!pendingReviews.length) {
    console.log("[Cron:ReviewModeration] No pending reviews.");
    return;
  }

  let processed = 0;
  for (const review of pendingReviews) {
    if (!review.comment && !review.title) {
      // Auto-approve rating-only reviews
      await db.updateReviewAiData(review.id, {
        aiSentimentScore: (review.rating / 5).toFixed(2),
        aiFlagged: false,
        status: "published",
      });
      processed++;
      continue;
    }

    const text = [review.title, review.comment].filter(Boolean).join(". ");
    const aiResponse = await callAI(
      `You are a content moderation AI for a family-friendly artisan bakery. 
Analyze the review and respond with ONLY valid JSON: 
{"sentiment": 0.0-1.0, "flagged": true/false, "reason": "brief reason if flagged or empty string"}
Flag reviews that contain: spam, hate speech, inappropriate content, fake reviews, or competitor mentions.
Do NOT flag genuine negative feedback about product quality or service.`,
      `Review (${review.rating}/5 stars): "${text}"`
    );

    if (!aiResponse) {
      // If AI unavailable, auto-publish non-flagged reviews
      await db.updateReviewAiData(review.id, { status: "published" });
      processed++;
      continue;
    }

    try {
      const parsed = JSON.parse(aiResponse) as {
        sentiment: number;
        flagged: boolean;
        reason: string;
      };

      await db.updateReviewAiData(review.id, {
        aiSentimentScore: Math.min(1, Math.max(0, parsed.sentiment)).toFixed(2),
        aiFlagged: parsed.flagged,
        status: parsed.flagged ? "pending" : "published",
      });

      if (parsed.flagged) {
        console.log(
          `[Cron:ReviewModeration] Flagged review ${review.id}: ${parsed.reason}`
        );
      }

      processed++;
    } catch {
      // JSON parse failed — publish anyway
      await db.updateReviewAiData(review.id, { status: "published" });
      processed++;
    }
  }

  console.log(`[Cron:ReviewModeration] Processed ${processed} reviews.`);
}

// ─── 4. Dynamic Pricing Recommendations ──────────────────────────────────────

async function runPricingRecommendations() {
  console.log("[Cron:Pricing] Running...");

  const velocity = await db.getOrderVelocityByProduct(30);
  if (!velocity.length) return;

  const allProducts = await db.getAllProductsAdmin();
  const productMap = new Map(allProducts.map(p => [p.id, p]));

  // Only analyze top 5 products by velocity to keep AI costs low
  const topProducts = velocity.slice(0, 5);

  for (const item of topProducts) {
    if (!item.productId) continue;
    const product = productMap.get(item.productId);
    if (!product) continue;

    const currentPrice = parseFloat(product.basePrice);
    const totalSold = Number(item.totalQuantity);
    const orderCount = Number(item.orderCount);

    const aiResponse = await callAI(
      `You are a pricing strategist for a small artisan bakery. 
Analyze sales data and suggest an optimal price adjustment.
Respond with ONLY valid JSON:
{"suggestedPrice": number, "reasoning": "1-2 sentence explanation", "confidence": "low|medium|high"}
Rules:
- Never suggest more than 20% increase or 15% decrease from current price
- Consider that this is a small family bakery with loyal customers
- Factor in demand velocity and order frequency
- Maintain price points that end in .00, .50, .95, or .99`,
      `Product: "${product.name}"
Current price: $${currentPrice.toFixed(2)}
Units sold (30 days): ${totalSold}
Orders (30 days): ${orderCount}
In stock: ${product.inStock}
Inventory cap: ${product.inventoryCap ?? "unlimited"}`
    );

    if (!aiResponse) continue;

    try {
      const parsed = JSON.parse(aiResponse) as {
        suggestedPrice: number;
        reasoning: string;
        confidence: string;
      };

      const suggestedPrice = Math.round(parsed.suggestedPrice * 100) / 100;

      // Only create recommendation if price change is meaningful (>= $0.50)
      if (Math.abs(suggestedPrice - currentPrice) < 0.5) continue;

      // Don't create duplicate pending recommendations for the same product
      const existing = await db.getPendingPricingRecommendations();
      const alreadyPending = existing.some(r => r.productId === product.id);
      if (alreadyPending) continue;

      await db.createPricingRecommendation({
        productId: product.id,
        currentPrice: currentPrice.toFixed(2),
        suggestedPrice: suggestedPrice.toFixed(2),
        reasoning: `[${parsed.confidence.toUpperCase()} confidence] ${parsed.reasoning}`,
      });

      console.log(
        `[Cron:Pricing] Recommendation for ${product.name}: $${currentPrice} → $${suggestedPrice}`
      );
    } catch (err) {
      console.error(`[Cron:Pricing] Failed to parse AI response for ${product.name}:`, err);
    }
  }

  console.log("[Cron:Pricing] Complete.");
}

// ─── 5. Marketing Campaign Generation ────────────────────────────────────────

const CAMPAIGN_PLATFORMS = ["instagram", "facebook"] as const;

async function runMarketingCampaigns() {
  console.log("[Cron:Marketing] Running...");

  // Only run Mon/Wed/Fri
  const dayOfWeek = new Date().getDay();
  if (![1, 3, 5].includes(dayOfWeek)) {
    console.log("[Cron:Marketing] Not a campaign day — skipping.");
    return;
  }

  const featuredProducts = await db.getFeaturedProducts();
  if (!featuredProducts.length) return;

  // Pick a random featured product to spotlight
  const product = featuredProducts[Math.floor(Math.random() * featuredProducts.length)];
  const platform = CAMPAIGN_PLATFORMS[Math.floor(Math.random() * CAMPAIGN_PLATFORMS.length)];

  const aiResponse = await callAI(
    `You are a social media manager for Fairytale Farms, a charming family-owned artisan bakery in Castalian Springs, Tennessee. 
Your brand voice is warm, magical, and community-focused. You celebrate handcrafted quality and local love.
Generate a social media post and respond with ONLY valid JSON:
{"caption": "full post caption with emojis and hashtags", "imagePrompt": "detailed image generation prompt for a professional food photography shot"}
Caption requirements:
- 150-280 characters for Instagram, 100-200 for Facebook  
- Include 3-5 relevant hashtags
- Warm, inviting tone
- Include a call to action
Image prompt requirements:
- Professional food photography style
- Warm, golden lighting
- Rustic/cozy bakery aesthetic`,
    `Platform: ${platform}
Product to feature: "${product.name}"
Description: "${product.description || "Delicious artisan baked good"}"
Price: $${parseFloat(product.basePrice).toFixed(2)}`
  );

  if (!aiResponse) return;

  try {
    const parsed = JSON.parse(aiResponse) as {
      caption: string;
      imagePrompt: string;
    };

    await db.createMarketingCampaign({
      platform,
      caption: parsed.caption,
      suggestedImagePrompt: parsed.imagePrompt,
      status: "draft",
    });

    console.log(`[Cron:Marketing] Campaign draft created for ${platform}: "${product.name}"`);
  } catch (err) {
    console.error("[Cron:Marketing] Failed to parse AI response:", err);
  }

  console.log("[Cron:Marketing] Complete.");
}

// ─── Review Request Emails ────────────────────────────────────────────────────

async function runReviewRequestEmails() {
  console.log("[Cron:ReviewRequests] Running...");

  // Send review requests for orders completed > 2 days ago
  const cutoff = new Date(Date.now() - 2 * 24 * 60 * 60_000);
  const orders = await db.getCompletedOrdersWithoutReviewRequest(cutoff);

  if (!orders.length) {
    console.log("[Cron:ReviewRequests] No orders to process.");
    return;
  }

  let sent = 0;
  for (const order of orders) {
    if (!order.customerEmail) continue;

    try {
      const items = await db.getOrderItems(order.id);
      const reviewItems = await Promise.all(
        items.map(async item => {
          const product = item.productId
            ? await db.getProductById(item.productId)
            : null;
          return {
            name: item.productName,
            productSlug: product?.slug || item.productName.toLowerCase().replace(/\s+/g, "-"),
          };
        })
      );

      const emailSent = await sendReviewRequestEmail({
        customerName: order.customerName || "Valued Customer",
        customerEmail: order.customerEmail,
        orderNumber: order.orderNumber,
        items: reviewItems,
      });

      if (emailSent) {
        await db.markOrderReviewRequestSent(order.id);
        sent++;
      }
    } catch (err) {
      console.error(`[Cron:ReviewRequests] Error for order ${order.id}:`, err);
    }
  }

  console.log(`[Cron:ReviewRequests] Sent ${sent} review request emails.`);
}

// ─── Entry Point ──────────────────────────────────────────────────────────────

export function startCronJobs() {
  console.log("[Cron] Starting AI automation jobs...");

  // 1. Demand Forecasting — every 6 hours
  schedule("DemandForecast", 6 * 60 * 60_000, runDemandForecast);

  // 2. Abandoned Cart Recovery — every hour
  schedule("AbandonedCart", 60 * 60_000, runAbandonedCartRecovery);

  // 3. Review Moderation — every 30 minutes
  schedule("ReviewModeration", 30 * 60_000, runReviewModeration);

  // 4. Dynamic Pricing — every 24 hours
  schedule("Pricing", 24 * 60 * 60_000, runPricingRecommendations);

  // 5. Marketing Campaigns — every 24 hours
  schedule("Marketing", 24 * 60 * 60_000, runMarketingCampaigns);

  // 6. Review Request Emails — every 6 hours
  schedule("ReviewRequests", 6 * 60 * 60_000, runReviewRequestEmails);

  console.log("[Cron] All jobs scheduled.");
}
