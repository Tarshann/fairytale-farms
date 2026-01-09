import type { Request, Response } from "express";
import Stripe from "stripe";
import { getDb } from "./db";
import { orders, orderItems, cartItems, products } from "../drizzle/schema";
import { eq } from "drizzle-orm";

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
    console.log("[Webhook] Test event detected, returning verification response");
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

  // Get cart items for this user
  const userCartItems = await db
    .select()
    .from(cartItems)
    .where(eq(cartItems.userId, userId));

  if (userCartItems.length === 0) {
    console.error("[Webhook] No cart items found for user:", userId);
    return;
  }

  // Calculate total amount
  const totalAmount = session.amount_total ? (session.amount_total / 100).toString() : "0";

  // Generate order number
  const orderNumber = `FF${Date.now()}${Math.floor(Math.random() * 1000)}`;

  // Create order
  const customerEmail = session.customer_email || session.metadata?.customer_email || "";
  const customerName = session.metadata?.customer_name || session.customer_details?.name || "Customer";
  
  const [orderResult] = await db.insert(orders).values({
    userId,
    orderNumber,
    totalAmount,
    customerName,
    customerEmail,
    status: "pending",
    stripePaymentIntentId: session.payment_intent as string,
  });

  const orderId = Number(orderResult.insertId);

  // Create order items from cart
  for (const cartItem of userCartItems) {
    // Get product details for this cart item
    const [product] = await db
      .select()
      .from(products)
      .where(eq(products.id, cartItem.productId))
      .limit(1);
    
    if (product) {
      const unitPrice = parseFloat(product.basePrice);
      const subtotal = unitPrice * cartItem.quantity;
      
      await db.insert(orderItems).values({
        orderId,
        productId: cartItem.productId,
        productName: product.name,
        quantity: cartItem.quantity,
        unitPrice: unitPrice.toFixed(2),
        subtotal: subtotal.toFixed(2),
        customizationNotes: cartItem.customizationNotes,
      });
    }
  }

  // Clear user's cart
  await db.delete(cartItems).where(eq(cartItems.userId, userId));

  // Update order status to completed
  await db
    .update(orders)
    .set({ status: "completed" })
    .where(eq(orders.id, orderId));

  console.log("[Webhook] Order created successfully:", orderNumber);
}
