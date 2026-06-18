/**
 * Stripe Webhook Handler
 *
 * Processes Stripe events and creates orders in the database.
 * Sends real transactional emails to both the customer and the bakery owner.
 */
import type { Request, Response } from "express";
import crypto from "crypto";
import Stripe from "stripe";
import { getDb } from "./db";
import { orders, orderItems, cartItems } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import { sendOrderConfirmation, sendAdminOrderNotification } from "./_core/email";
import { ENV } from "./_core/env";

const stripe = new Stripe(ENV.stripeSecretKey!, {
  // Pinned API version. Cast keeps the deliberate pin valid across stripe-node
  // SDK bumps (the SDK's types only allow its own bundled version string).
  apiVersion: "2025-01-27.acacia" as Stripe.StripeConfig["apiVersion"],
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
      ENV.stripeWebhookSecret!
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[Webhook] Signature verification failed:", message);
    return res.status(400).send(`Webhook Error: ${message}`);
  }

  // Return early for Stripe CLI test events (no real data to process)
  if (event.id.startsWith("evt_test_")) {
    console.log("[Webhook] Test event detected, returning verification response");
    return res.json({ verified: true });
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

  // ── Extract user identity ────────────────────────────────────────────────
  const userId = session.client_reference_id
    ? parseInt(session.client_reference_id)
    : session.metadata?.user_id
      ? parseInt(session.metadata.user_id)
      : null;

  if (!userId) {
    console.error("[Webhook] No user ID found in session");
    return;
  }

  // ── Expand line items ────────────────────────────────────────────────────
  const lineItemsResponse = await stripe.checkout.sessions.listLineItems(session.id, {
    expand: ["data.price.product"],
  });

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
    console.error("[Webhook] No purchasable line items found for session:", session.id);
    return;
  }

  // ── Idempotency guard ────────────────────────────────────────────────────
  const paymentIntentId =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.payment_intent?.id;

  if (paymentIntentId) {
    const existingOrder = await db
      .select({ id: orders.id })
      .from(orders)
      .where(eq(orders.stripePaymentIntentId, paymentIntentId))
      .limit(1);
    if (existingOrder.length > 0) {
      console.log("[Webhook] Order already exists for session:", session.id);
      return;
    }
  }

  // ── Build order record ───────────────────────────────────────────────────
  const randomSuffix = crypto.randomInt(1000, 9999);
  const orderNumber = `FF${Date.now()}${randomSuffix}`;

  const customerEmail =
    session.customer_email || session.metadata?.customer_email || "";
  const customerName =
    session.metadata?.customer_name ||
    session.customer_details?.name ||
    "Customer";

  const totalAmount = session.amount_total
    ? (session.amount_total / 100).toFixed(2)
    : "0.00";

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

  // ── Persist order ────────────────────────────────────────────────────────
  const [orderResult] = await db
    .insert(orders)
    .values({
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
    })
    .returning({ id: orders.id });

  const orderId = orderResult.id;

  await db.insert(orderItems).values(
    purchasedItems.map(item => ({
      orderId,
      productId: item.productId,
      productName: item.productName,
      quantity: item.quantity,
      unitPrice: item.unitPrice.toFixed(2),
      subtotal: (item.unitPrice * item.quantity).toFixed(2),
      customizationNotes: item.customizationNotes,
    }))
  );

  // Clear the user's cart after successful order creation
  await db.delete(cartItems).where(eq(cartItems.userId, userId));

  console.log("[Webhook] Order created successfully:", orderNumber);

  // ── Send transactional emails ────────────────────────────────────────────
  const emailItems = purchasedItems.map(item => ({
    name: item.productName,
    quantity: item.quantity,
    price: `$${(item.unitPrice * item.quantity).toFixed(2)}`,
    customizationNotes: item.customizationNotes,
  }));

  const emailData = {
    orderNumber,
    customerName,
    customerEmail,
    totalAmount,
    isDeposit,
    remainingAmount:
      isDeposit && remainingAmount !== null ? remainingAmount.toFixed(2) : null,
    promoCode: promoCode ?? null,
    discountAmount:
      discountAmount !== null ? discountAmount.toFixed(2) : null,
    deliveryZipCode: deliveryZipCode ?? null,
    deliveryType: deliveryType ?? null,
    scheduledDeliveryDate: scheduledDeliveryDate ?? null,
    items: emailItems,
  };

  // Send customer confirmation email
  if (customerEmail) {
    const sent = await sendOrderConfirmation(emailData);
    if (!sent) {
      console.warn(
        "[Webhook] Customer confirmation email not sent (SMTP may not be configured). Order:",
        orderNumber
      );
    }
  }

  // Send admin notification email
  await sendAdminOrderNotification(emailData);
}
