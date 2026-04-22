/**
 * Abandoned Cart Router — tracking and recovery for incomplete checkouts
 */
import { z } from "zod";
import { sessionProcedure, router, adminProcedure, db } from "./_shared";

export const abandonedCartRouter = router({
  track: sessionProcedure
    .input(z.object({ cartContents: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user.email) return { success: false };
      await db.upsertAbandonedCart(ctx.user.id, ctx.user.email, input.cartContents);
      return { success: true };
    }),

  clear: sessionProcedure.mutation(async ({ ctx }) => {
    await db.deleteAbandonedCartForUser(ctx.user.id);
    return { success: true };
  }),

  all: adminProcedure.query(async () => {
    return await db.getAllAbandonedCartsAdmin();
  }),
});
