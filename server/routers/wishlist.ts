/**
 * Wishlist Router — authenticated user wishlist management
 */
import { z } from "zod";
import { protectedProcedure, router, db } from "./_shared";

export const wishlistRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    return await db.getWishlistItems(ctx.user.id);
  }),

  productIds: protectedProcedure.query(async ({ ctx }) => {
    return await db.getWishlistProductIds(ctx.user.id);
  }),

  count: protectedProcedure.query(async ({ ctx }) => {
    return await db.getWishlistCount(ctx.user.id);
  }),

  isInWishlist: protectedProcedure
    .input(z.object({ productId: z.number() }))
    .query(async ({ ctx, input }) => {
      return await db.isInWishlist(ctx.user.id, input.productId);
    }),

  add: protectedProcedure
    .input(z.object({ productId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const result = await db.addToWishlist(ctx.user.id, input.productId);
      return { success: true, item: result };
    }),

  remove: protectedProcedure
    .input(z.object({ productId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await db.removeFromWishlist(ctx.user.id, input.productId);
      return { success: true };
    }),

  toggle: protectedProcedure
    .input(z.object({ productId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const isInList = await db.isInWishlist(ctx.user.id, input.productId);
      if (isInList) {
        await db.removeFromWishlist(ctx.user.id, input.productId);
        return { success: true, added: false };
      } else {
        await db.addToWishlist(ctx.user.id, input.productId);
        return { success: true, added: true };
      }
    }),
});
