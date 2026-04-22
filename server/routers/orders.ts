/**
 * Orders Router — checkout creation, order retrieval, status management
 */
import { z } from "zod";
import crypto from "crypto";
import {
  TRPCError,
  sessionProcedure,
  protectedProcedure,
  router,
  adminProcedure,
  db,
  ENV,
  assertCheckoutEnabled,
  getStripe,
} from "./_shared";
import { sendOrderStatusUpdate, sendOrderConfirmation } from "../_core/email";

export const ordersRouter = router({
  /**
   * Standard cart checkout — creates a Stripe session from the user's cart.
   */
  createCheckout: sessionProcedure.mutation(async ({ ctx }) => {
    await assertCheckoutEnabled();
    const stripe = await getStripe();
    const cartItemsList = await db.getCartItems(ctx.user.id);
    if (!cartItemsList || cartItemsList.length === 0) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "Cart is empty" });
    }
    const lineItems = cartItemsList.map(item => {
      const metadata: Record<string, string> = {};
      if (item.product?.id) metadata.productId = item.product.id.toString();
      if (item.customizationNotes) metadata.customizationNotes = item.customizationNotes;
      return {
        price_data: {
          currency: "usd",
          product_data: {
            name: item.product?.name || "Product",
            description: item.customizationNotes || undefined,
            ...(Object.keys(metadata).length > 0 ? { metadata } : {}),
          },
          unit_amount: Math.round(parseFloat(item.product?.basePrice || "0") * 100),
        },
        quantity: item.quantity,
      };
    });
    const origin = ctx.req.headers.origin || ENV.appOrigin || "http://localhost:3000";
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      success_url: `${origin}/order-confirmation?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/cart`,
      client_reference_id: ctx.user.id.toString(),
      customer_email: ctx.user.email || undefined,
      metadata: {
        user_id: ctx.user.id.toString(),
        customer_email: ctx.user.email || "",
        customer_name: ctx.user.name || "",
      },
      allow_promotion_codes: true,
    });
    return { checkoutUrl: session.url, sessionId: session.id };
  }),

  /**
   * Manual order creation (used by admin or direct integrations).
   */
  create: sessionProcedure
    .input(
      z.object({
        items: z.array(
          z.object({
            productId: z.number(),
            productName: z.string(),
            quantity: z.number(),
            unitPrice: z.string(),
            customizationNotes: z.string().optional(),
          })
        ),
        totalAmount: z.string(),
        customerName: z.string(),
        customerEmail: z.string(),
        customerPhone: z.string().optional(),
        deliveryAddress: z.string().optional(),
        deliveryNotes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await assertCheckoutEnabled();
      const orderNumber = `FF-${Date.now()}-${crypto.randomBytes(5).toString("hex").toUpperCase()}`;
      const orderId = await db.createOrder({
        userId: ctx.user.id,
        orderNumber,
        status: "pending",
        totalAmount: input.totalAmount,
        customerName: input.customerName,
        customerEmail: input.customerEmail,
        customerPhone: input.customerPhone,
        deliveryAddress: input.deliveryAddress,
        deliveryNotes: input.deliveryNotes,
      });
      for (const item of input.items) {
        const subtotal = (parseFloat(item.unitPrice) * item.quantity).toFixed(2);
        await db.createOrderItem({
          orderId,
          productId: item.productId,
          productName: item.productName,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          subtotal,
          customizationNotes: item.customizationNotes,
        });
      }
      return { orderId, orderNumber, success: true };
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const order = await db.getOrderById(input.id);
      if (!order) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Order not found" });
      }
      const sameCustomerEmail =
        ctx.user.email && order.customerEmail
          ? ctx.user.email.toLowerCase() === order.customerEmail.toLowerCase()
          : false;
      if (order.userId !== ctx.user.id && !sameCustomerEmail && ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
      }
      const items = await db.getOrderItems(order.id);
      return { ...order, items };
    }),

  getByCheckoutSession: sessionProcedure
    .input(z.object({ sessionId: z.string() }))
    .query(async ({ ctx, input }) => {
      const stripe = await getStripe();
      const session = await stripe.checkout.sessions.retrieve(input.sessionId);
      const sessionUserId = session.client_reference_id
        ? parseInt(session.client_reference_id)
        : session.metadata?.user_id
          ? parseInt(session.metadata.user_id)
          : null;
      if (sessionUserId && sessionUserId !== ctx.user.id && ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
      }
      const paymentIntentId =
        typeof session.payment_intent === "string"
          ? session.payment_intent
          : session.payment_intent?.id;
      if (!paymentIntentId) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Order not found" });
      }
      const order = await db.getOrderByPaymentIntentId(paymentIntentId);
      if (!order) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Order not found" });
      }
      if (order.userId !== ctx.user.id && ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
      }
      const items = await db.getOrderItems(order.id);
      return { ...order, items };
    }),

  myOrders: protectedProcedure.query(async ({ ctx }) => {
    return await db.getOrdersForAccount(ctx.user.id, ctx.user.email);
  }),

  reorder: protectedProcedure
    .input(z.object({ orderId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await assertCheckoutEnabled();
      const order = await db.getOrderById(input.orderId);
      if (!order) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Order not found" });
      }
      const sameCustomerEmail =
        ctx.user.email && order.customerEmail
          ? ctx.user.email.toLowerCase() === order.customerEmail.toLowerCase()
          : false;
      if (order.userId !== ctx.user.id && !sameCustomerEmail) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
      }
      const items = await db.getOrderItems(order.id);
      await db.clearCart(ctx.user.id);
      for (const item of items) {
        await db.addToCart({
          userId: ctx.user.id,
          productId: item.productId,
          quantity: item.quantity,
          customizationNotes: item.customizationNotes ?? undefined,
        });
      }
      return { success: true };
    }),

  updateStatus: adminProcedure
    .input(
      z.object({
        id: z.number(),
        status: z.enum(["pending", "processing", "completed", "cancelled"]),
        adminNote: z.string().optional(),
        sendEmail: z.boolean().default(true),
      })
    )
    .mutation(async ({ input }) => {
      await db.updateOrderStatus(input.id, input.status);
      if (input.adminNote) {
        await db.updateOrderAdminNote(input.id, input.adminNote);
      }
      if (
        input.sendEmail &&
        (input.status === "processing" || input.status === "completed" || input.status === "cancelled")
      ) {
        const order = await db.getOrderById(input.id);
        if (order?.customerEmail) {
          await sendOrderStatusUpdate({
            orderNumber: order.orderNumber,
            customerName: order.customerName || "Valued Customer",
            customerEmail: order.customerEmail,
            status: input.status as "processing" | "completed" | "cancelled",
            adminNote: input.adminNote,
          });
        }
      }
      return { success: true };
    }),

  updatePayment: adminProcedure
    .input(
      z.object({
        id: z.number(),
        paymentIntentId: z.string(),
        paymentStatus: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      await db.updateOrderPayment(input.id, input.paymentIntentId, input.paymentStatus);
      return { success: true };
    }),

  /**
   * Collect the remaining balance for a deposit order.
   * Creates a new Stripe Payment Link for the remaining amount and returns the URL.
   * The admin sends this link to the customer, or it can be used at pickup.
   */
  collectRemainingBalance: adminProcedure
    .input(
      z.object({
        orderId: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      const order = await db.getOrderById(input.orderId);
      if (!order) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Order not found" });
      }
      if (!order.depositPaid || !order.remainingAmount || parseFloat(order.remainingAmount) <= 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "This order has no outstanding balance.",
        });
      }
      const stripe = await getStripe();
      const remainingCents = Math.round(parseFloat(order.remainingAmount) * 100);
      const origin = ENV.appOrigin || "https://fairytalefarms.net";
      // Create a Stripe Payment Link for the remaining amount
      const paymentLink = await stripe.paymentLinks.create({
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: `Remaining Balance — Order #${order.orderNumber}`,
                description: `Final payment for your Fairytale Farms order.`,
              },
              unit_amount: remainingCents,
            },
            quantity: 1,
          },
        ],
        after_completion: {
          type: "redirect",
          redirect: { url: `${origin}/my-orders` },
        },
        metadata: {
          order_id: order.id.toString(),
          order_number: order.orderNumber,
          is_remaining_balance: "true",
        },
      });
      return { paymentLinkUrl: paymentLink.url, success: true };
    }),
});
