/**
 * Cart Router — session-scoped cart management (add, update, remove, clear)
 */
import { z } from "zod";
import { TRPCError, sessionProcedure, router, db, assertCheckoutEnabled } from "./_shared";

export const cartRouter = router({
  get: sessionProcedure.query(async ({ ctx }) => {
    return await db.getCartItems(ctx.user.id);
  }),

  add: sessionProcedure
    .input(
      z.object({
        productId: z.number(),
        quantity: z.number().min(1).default(1),
        customizationNotes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await assertCheckoutEnabled();
      try {
        const id = await db.addToCart({ userId: ctx.user.id, ...input });
        return { id, success: true };
      } catch {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Unable to add item to cart. Please try again.",
        });
      }
    }),

  updateQuantity: sessionProcedure
    .input(z.object({ id: z.number(), quantity: z.number().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const item = await db.getCartItemById(input.id);
      if (!item || item.userId !== ctx.user.id) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Cart item not found" });
      }
      await db.updateCartItemQuantity(input.id, input.quantity);
      return { success: true };
    }),

  remove: sessionProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const item = await db.getCartItemById(input.id);
      if (!item || item.userId !== ctx.user.id) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Cart item not found" });
      }
      await db.removeFromCart(input.id);
      return { success: true };
    }),

  clear: sessionProcedure.mutation(async ({ ctx }) => {
    await db.clearCart(ctx.user.id);
    return { success: true };
  }),
});
