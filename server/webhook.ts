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
import { sendOrderConfirmationSms, sendAdminOrderSms } from "./_core/sms";
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
        // Subscription checkouts are billed via invoice.paid (covers the first
        // charge AND every renewal), so the one-time path is left untouched.
        if (session.mode === "subscription") {
          console.log("[Webhook] Subscription created:", session.id);
        } else {
          await handleCheckoutCompleted(session);
        }
        break;
      }

      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice;
        await handleSubscriptionInvoice(invoice);
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
  // Stripe Checkout collects a phone when phone_number_collection is enabled.
  const customerPhone =
    session.customer_details?.phone || session.metadata?.customer_phone || null;

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
      customerPhone: customerPhone ?? undefined,
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

  // ── Send SMS notifications (no-ops unless Twilio is configured) ────────────
  await sendAdminOrderSms({ orderNumber, customerName, totalAmount });
  if (customerPhone) {
    await sendOrderConfirmationSms({ customerPhone, orderNumber, customerName });
  }
}

/**
 * Records an order for each paid subscription invoice — the first charge and
 * every renewal. Reads identity/product from the subscription metadata set in
 * orders.createSubscriptionCheckout. Entirely separate from the one-time path
 * and fail-soft: any missing field is logged and skipped, never thrown.
 */
async function handleSubscriptionInvoice(invoice: Stripe.Invoice) {
  // The subscription id can live in a couple of places across API versions.
  const subscriptionId =
    typeof (invoice as any).subscription === "string"
      ? (invoice as any).subscription
      : (invoice as any).subscription?.id ||
        (invoice as any).parent?.subscription_details?.subscription ||
        null;

  if (!subscriptionId) {
    // Not a subscription invoice (e.g. a one-off) — nothing to do here.
    return;
  }

  const db = await getDb();
  if (!db) {
    console.error("[Webhook] Database not available for subscription invoice");
    return;
  }

  // Pull the subscription to read the metadata we stamped at checkout.
  let meta: Record<string, string> = {};
  try {
    const sub = await stripe.subscriptions.retrieve(subscriptionId);
    meta = (sub.metadata as Record<string, string>) || {};
  } catch (err) {
    console.warn(
      "[Webhook] Could not retrieve subscription metadata:",
      err instanceof Error ? err.message : String(err)
    );
  }

  const userId = meta.user_id ? parseInt(meta.user_id) : NaN;
  if (!Number.isFinite(userId)) {
    console.warn("[Webhook] Subscription invoice missing user_id; skipping order.");
    return;
  }

  const productId = meta.product_id ? parseInt(meta.product_id) : null;
  const productName = meta.product_name || "Subscription";
  const customerName = meta.customer_name || invoice.customer_name || "Customer";
  const customerEmail =
    meta.customer_email || invoice.customer_email || "";
  const customerPhone =
    (invoice as any).customer_phone || null;
  const totalAmount = ((invoice.amount_paid ?? 0) / 100).toFixed(2);

  const randomSuffix = crypto.randomInt(1000, 9999);
  const orderNumber = `FFSUB${Date.now()}${randomSuffix}`;

  const [orderResult] = await db
    .insert(orders)
    .values({
      userId,
      orderNumber,
      totalAmount,
      customerName,
      customerEmail,
      customerPhone: customerPhone ?? undefined,
      status: "pending",
      stripePaymentIntentId:
        typeof (invoice as any).payment_intent === "string"
          ? (invoice as any).payment_intent
          : undefined,
      stripePaymentStatus: "paid",
    })
    .returning({ id: orders.id });

  if (productId) {
    await db.insert(orderItems).values({
      orderId: orderResult.id,
      productId,
      productName,
      quantity: 1,
      unitPrice: totalAmount,
      subtotal: totalAmount,
    });
  }

  console.log("[Webhook] Subscription order recorded:", orderNumber);

  const emailData = {
    orderNumber,
    customerName,
    customerEmail,
    totalAmount,
    items: [{ name: productName, quantity: 1, price: `$${totalAmount}` }],
  };

  if (customerEmail) await sendOrderConfirmation(emailData);
  await sendAdminOrderNotification(emailData);
  await sendAdminOrderSms({ orderNumber, customerName, totalAmount });
  if (customerPhone) {
    await sendOrderConfirmationSms({ customerPhone, orderNumber, customerName });
  }
}
