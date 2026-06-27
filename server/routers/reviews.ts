/**
 * Reviews Router — public product reviews and admin moderation
 */
import { z } from "zod";
import { TRPCError, publicProcedure, protectedProcedure, router, adminProcedure, db } from "./_shared";

export const reviewsRouter = router({
  listByProduct: publicProcedure
    .input(z.object({ productId: z.number() }))
    .query(async ({ input }) => {
      return await db.getReviewsByProductWithUser(input.productId);
    }),

  ratingSummary: publicProcedure
    .input(z.object({ productId: z.number() }))
    .query(async ({ input }) => {
      return await db.getProductRatingSummary(input.productId);
    }),

  // Recent published reviews across all products — powers homepage testimonials.
  recentPublished: publicProcedure
    .input(z.object({ limit: z.number().int().min(1).max(24).default(6) }).optional())
    .query(async ({ input }) => {
      return await db.getRecentPublishedReviews(input?.limit ?? 6);
    }),

  myReview: protectedProcedure
    .input(z.object({ productId: z.number() }))
    .query(async ({ ctx, input }) => {
      return await db.getUserReviewForProduct(ctx.user.id, input.productId);
    }),

  submit: protectedProcedure
    .input(
      z.object({
        productId: z.number(),
        rating: z.number().min(1).max(5),
        title: z.string().max(200).optional(),
        comment: z.string().max(2000).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await db.getUserReviewForProduct(ctx.user.id, input.productId);
      if (existing) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "You have already reviewed this product.",
        });
      }
      const id = await db.createReview({
        productId: input.productId,
        userId: ctx.user.id,
        rating: input.rating,
        title: input.title,
        comment: input.comment,
        status: "pending",
      });
      return { id, success: true };
    }),

  // Admin
  pending: adminProcedure.query(async () => {
    return await db.getPendingReviews();
  }),

  all: adminProcedure.query(async () => {
    return await db.getAllReviewsAdmin();
  }),

  updateStatus: adminProcedure
    .input(z.object({ id: z.number(), status: z.enum(["pending", "published", "rejected"]) }))
    .mutation(async ({ input }) => {
      await db.updateReviewStatus(input.id, input.status);
      return { success: true };
    }),
});
