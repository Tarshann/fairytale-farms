import type { Request, Response } from "express";
import Stripe from "stripe";
import { getDb } from "./db";
import { orders, orderItems, cartItems } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import { notifyOwner } from "./_core/notification";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-12-15.clover",
});

export async function handleStripeWebhook(req: Request, res: Response) {
  const sig = req.headers["stripe-signature"];

  if (!sig) {
    console.error("[Webhook] No signature found");
    return res.status(400).send("No signature");
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    console.error("[Webhook] Signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle test events
  if (event.id.startsWith("evt_test_")) {
    console.log(
      "[Webhook] Test event detected, returning verification response"
    );
    return res.json({
      verified: true,
    });
  }

  console.log("[Webhook] Received event:", event.type, event.id);

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session);
        break;
      }

      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log("[Webhook] Payment succeeded:", paymentIntent.id);
        break;
      }

      default:
        console.log("[Webhook] Unhandled event type:", event.type);
    }

    res.json({ received: true });
  } catch (error) {
    console.error("[Webhook] Error processing event:", error);
    res.status(500).json({ error: "Webhook processing failed" });
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  console.log("[Webhook] Processing checkout.session.completed:", session.id);

  const db = await getDb();
  if (!db) {
    console.error("[Webhook] Database not available");
    return;
  }

  // Extract user information from metadata
  const userId = session.client_reference_id
    ? parseInt(session.client_reference_id)
    : session.metadata?.user_id
      ? parseInt(session.metadata.user_id)
      : null;

  if (!userId) {
    console.error("[Webhook] No user ID found in session");
    return;
  }

  const lineItemsResponse = await stripe.checkout.sessions.listLineItems(
    session.id,
    {
      expand: ["data.price.product"],
    }
  );

  const purchasedItems = lineItemsResponse.data
    .map(item => {
      const price = item.price;
      const product = price?.product;
      if (!product || typeof product === "string") return null;
      if ("deleted" in product && product.deleted) return null;

      const productIdValue = product.metadata?.productId;
      if (!productIdValue) return null;
      const productId = Number.parseInt(productIdValue, 10);
      if (!Number.isFinite(productId)) return null;

      const quantity = item.quantity ?? 1;
      const unitAmount =
        price?.unit_amount ??
        (item.amount_total && quantity > 0
          ? Math.round(item.amount_total / quantity)
          : 0);

      return {
        productId,
        productName: product.name || item.description || "Product",
        quantity,
        unitPrice: unitAmount / 100,
        customizationNotes: product.metadata?.customizationNotes || undefined,
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

  if (purchasedItems.length === 0) {
    console.error(
      "[Webhook] No purchasable line items found for session:",
      session.id
    );
    return;
  }

  const totalAmount = session.amount_total
    ? (session.amount_total / 100).toFixed(2)
    : "0.00";

  // Generate order number
  const orderNumber = `FF${Date.now()}${Math.floor(Math.random() * 1000)}`;

  // Create order
  const customerEmail =
    session.customer_email || session.metadata?.customer_email || "";
  const customerName =
    session.metadata?.customer_name ||
    session.customer_details?.name ||
    "Customer";

  const isDeposit = session.metadata?.is_deposit === "true";
  const discountAmount = session.metadata?.discount_amount
    ? Number.parseFloat(session.metadata.discount_amount)
    : null;
  const promoCode = session.metadata?.promo_code || undefined;
  const deliveryZipCode = session.metadata?.delivery_zip || undefined;
  const deliveryType =
    session.metadata?.delivery_type === "same_day" ||
    session.metadata?.delivery_type === "scheduled"
      ? session.metadata.delivery_type
      : undefined;
  const scheduledDeliveryDate = session.metadata?.scheduled_date
    ? new Date(session.metadata.scheduled_date)
    : undefined;
  const remainingAmount = session.metadata?.remaining_amount
    ? Number.parseFloat(session.metadata.remaining_amount)
    : null;
  const paymentIntentId =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.payment_intent?.id;

  const [orderResult] = await db.insert(orders).values({
    userId,
    orderNumber,
    totalAmount,
    customerName,
    customerEmail,
    status: "pending",
    stripePaymentIntentId: paymentIntentId,
    stripePaymentStatus: session.payment_status,
    promoCode,
    discountAmount:
      discountAmount !== null ? discountAmount.toFixed(2) : undefined,
    deliveryZipCode,
    deliveryType,
    scheduledDeliveryDate,
    depositPaid: isDeposit ? true : undefined,
    depositAmount: isDeposit ? totalAmount : undefined,
    remainingAmount:
      isDeposit && remainingAmount !== null
        ? remainingAmount.toFixed(2)
        : undefined,
  }).returning({ id: orders.id });

  const orderId = orderResult.id;

  for (const item of purchasedItems) {
    const subtotal = item.unitPrice * item.quantity;

    await db.insert(orderItems).values({
      orderId,
      productId: item.productId,
      productName: item.productName,
      quantity: item.quantity,
      unitPrice: item.unitPrice.toFixed(2),
      subtotal: subtotal.toFixed(2),
      customizationNotes: item.customizationNotes,
    });
  }

  await db.delete(cartItems).where(eq(cartItems.userId, userId));

  console.log("[Webhook] Order created successfully:", orderNumber);

  // Send order confirmation email to customer
  if (customerEmail) {
    const itemDetails = purchasedItems.map(item => ({
      name: item.productName,
      quantity: item.quantity,
      price: `$${(item.unitPrice * item.quantity).toFixed(2)}`,
      customizationNotes: item.customizationNotes,
    }));

    await sendOrderConfirmationEmail({
      orderNumber,
      customerName,
      customerEmail,
      totalAmount,
      items: itemDetails,
    });
  }
}

interface OrderEmailData {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  totalAmount: string;
  items: Array<{
    name: string;
    quantity: number;
    price: string;
    customizationNotes?: string | null | undefined;
  }>;
}

async function sendOrderConfirmationEmail(data: OrderEmailData) {
  const itemsList = data.items
    .map(item => {
      const notes = item.customizationNotes
        ? ` (Notes: ${item.customizationNotes})`
        : "";
      return `• ${item.name} (x${item.quantity}) - ${item.price}${notes}`;
    })
    .join("\n");

  const emailContent = `
Hi ${data.customerName}!

Thank you for your order from Fairytale Farms! 🎂

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ORDER CONFIRMATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Order Number: ${data.orderNumber}

Your Items:
${itemsList}

Total: $${parseFloat(data.totalAmount).toFixed(2)}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PICKUP INFORMATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

We'll contact you to arrange pickup at our location in Castalian Springs, Tennessee.

Porch pickup is available - we'll let you know when your order is ready!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
QUESTIONS?
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Reply to this email or contact us at:
fairytalefarms.net@gmail.com

Thank you for supporting our small family bakery!

With love,
Fairytale Farms 🧁
`.trim();

  try {
    // Notify the bakery owner about the new order
    await notifyOwner({
      title: `🎂 New Order #${data.orderNumber}`,
      content: `New order from ${data.customerName} (${data.customerEmail})\n\nItems:\n${itemsList}\n\nTotal: $${parseFloat(data.totalAmount).toFixed(2)}`,
    });
    console.log(
      "[Webhook] Owner notification sent for order:",
      data.orderNumber
    );
    console.log(
      "[Webhook] Customer email would be sent to:",
      data.customerEmail
    );
    console.log("[Webhook] Email content:", emailContent);
  } catch (error) {
    console.error("[Webhook] Failed to send notifications:", error);
  }
}
