/**
 * Valentines Router — Valentine's Day collection, delivery zones, promo codes,
 * photo uploads, and the extended checkout with deposit/promo support.
 */
import { z } from "zod";
import {
  TRPCError,
  publicProcedure,
  protectedProcedure,
  router,
  adminProcedure,
  db,
  ENV,
  assertCheckoutEnabled,
  getStripe,
  getSafeCheckoutOrigin,
} from "./_shared";

export const valentinesRouter = router({
  products: publicProcedure.query(async () => {
    return await db.getValentinesProducts();
  }),

  tiers: publicProcedure.query(async () => {
    return await db.getProductsByType("tier");
  }),

  buildYourOwnItems: publicProcedure.query(async () => {
    return await db.getProductsByType("build_your_own_item");
  }),

  customPortrait: publicProcedure.query(async () => {
    const products = await db.getProductsByType("custom_portrait");
    return products[0] || null;
  }),

  validateDeliveryZone: publicProcedure
    .input(z.object({ zipCode: z.string().min(5).max(10).trim() }))
    .query(async ({ input }) => {
      return await db.validateDeliveryZone(input.zipCode);
    }),

  deliveryZones: publicProcedure.query(async () => {
    return await db.getAllDeliveryZones();
  }),

  validatePromoCode: publicProcedure
    .input(z.object({ code: z.string().min(1).max(50).trim().toUpperCase() }))
    .query(async ({ input }) => {
      return await db.validatePromoCode(input.code);
    }),

  checkAvailability: publicProcedure
    .input(z.object({ productId: z.number().int().positive(), quantity: z.number().int().min(1).max(100) }))
    .query(async ({ input }) => {
      return await db.checkProductAvailability(input.productId, input.quantity);
    }),

  uploadPhoto: protectedProcedure
    .input(
      z.object({
        orderId: z.number(),
        fileUrl: z.string().url().max(2000),
        fileKey: z.string().min(1).max(500).trim(),
        fileName: z.string().min(1).max(255).trim(),
        fileSize: z.number().int().positive().max(20 * 1024 * 1024), // 20MB max
        mimeType: z.enum(["image/jpeg", "image/png"]),  // enforce at schema level
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (input.fileSize < 1024 * 1024) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Photo must be at least 1MB for high resolution",
        });
      }
      if (!["image/jpeg", "image/png"].includes(input.mimeType)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Only JPG and PNG formats are accepted",
        });
      }
      const id = await db.createPhotoUpload({
        orderId: input.orderId,
        userId: ctx.user.id,
        fileUrl: input.fileUrl,
        fileKey: input.fileKey,
        fileName: input.fileName,
        fileSize: input.fileSize,
        mimeType: input.mimeType,
      });
      return { id, success: true };
    }),

  getPhotos: protectedProcedure
    .input(z.object({ orderId: z.number() }))
    .query(async ({ input }) => {
      return await db.getPhotoUploadsByOrder(input.orderId);
    }),

  pendingPhotos: adminProcedure.query(async () => {
    return await db.getPendingPhotoUploads();
  }),

  updatePhotoStatus: adminProcedure
    .input(
      z.object({
        id: z.number(),
        status: z.enum(["pending_review", "approved", "rejected"]),
        reviewNotes: z.string().max(1000).trim().optional(),
      })
    )
    .mutation(async ({ input }) => {
      await db.updatePhotoUploadStatus(input.id, input.status, input.reviewNotes);
      return { success: true };
    }),

  /**
   * Valentine's Day checkout with promo codes, deposit support, and delivery scheduling.
   * This is the extended checkout used for seasonal orders.
   */
  createValentinesCheckout: protectedProcedure
    .input(
      z.object({
        promoCode: z.string().min(1).max(50).trim().toUpperCase().optional(),
        deliveryZipCode: z.string().min(5).max(10).trim(),
        scheduledDeliveryDate: z.string().max(50).optional(),
        deliveryType: z.enum(["same_day", "scheduled"]).default("same_day"),
        deliveryAddress: z.string().min(1).max(500).trim(),
        deliveryNotes: z.string().max(1000).trim().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await assertCheckoutEnabled();
      const stripe = await getStripe();

      const zoneValidation = await db.validateDeliveryZone(input.deliveryZipCode);
      if (!zoneValidation.valid) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: zoneValidation.reason || "Invalid delivery zone",
        });
      }

      const cartItems = await db.getCartItems(ctx.user.id);
      if (!cartItems || cartItems.length === 0) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Cart is empty" });
      }

      const hasDepositItem = cartItems.some(item => item.product?.requiresDeposit);

      let subtotal = cartItems.reduce(
        (sum, item) => sum + parseFloat(item.product?.basePrice || "0") * item.quantity,
        0
      );

      let discountAmount = 0;
      let promoCodeData = null;
      if (input.promoCode) {
        const promoValidation = await db.validatePromoCode(input.promoCode);
        if (promoValidation.valid && promoValidation.promoCode) {
          promoCodeData = promoValidation.promoCode;
          const productTypes = cartItems.map(item => item.product?.productType || "standard");
          discountAmount = await db.calculateDiscount(promoCodeData, subtotal, productTypes);
        }
      }

      const totalAfterDiscount = subtotal - discountAmount;
      const chargeAmount = hasDepositItem ? totalAfterDiscount * 0.5 : totalAfterDiscount;

      const lineItems = cartItems.map(item => {
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
            unit_amount: Math.round(
              parseFloat(item.product?.basePrice || "0") * 100 * (hasDepositItem ? 0.5 : 1)
            ),
          },
          quantity: item.quantity,
        };
      });

      if (discountAmount > 0) {
        lineItems.push({
          price_data: {
            currency: "usd",
            product_data: {
              name: `Discount (${input.promoCode})`,
              description: undefined,
            },
            unit_amount: -Math.round(discountAmount * 100 * (hasDepositItem ? 0.5 : 1)),
          },
          quantity: 1,
        });
      }

      const origin = getSafeCheckoutOrigin(ctx.req);

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: lineItems,
        mode: "payment",
        success_url: `${origin}/order-confirmation?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/cart`,
        client_reference_id: ctx.user.id.toString(),
        customer_email: ctx.user.email || undefined,
        // Collect a phone so we can send order SMS (used only if Twilio is set up).
        phone_number_collection: { enabled: true },
        metadata: {
          user_id: ctx.user.id.toString(),
          customer_email: ctx.user.email || "",
          customer_name: ctx.user.name || "",
          promo_code: input.promoCode || "",
          discount_amount: discountAmount.toString(),
          delivery_zip: input.deliveryZipCode,
          delivery_type: input.deliveryType,
          scheduled_date: input.scheduledDeliveryDate || "",
          is_deposit: hasDepositItem ? "true" : "false",
          remaining_amount: hasDepositItem ? (totalAfterDiscount * 0.5).toFixed(2) : "0",
        },
        allow_promotion_codes: false,
      });

      return {
        checkoutUrl: session.url,
        sessionId: session.id,
        isDeposit: hasDepositItem,
        depositAmount: hasDepositItem ? chargeAmount : null,
        remainingAmount: hasDepositItem ? totalAfterDiscount * 0.5 : null,
        discountApplied: discountAmount,
      };
    }),
});
