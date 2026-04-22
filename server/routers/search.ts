/**
 * Search Router — full-text product search
 */
import { z } from "zod";
import { publicProcedure, router, db } from "./_shared";

export const searchRouter = router({
  products: publicProcedure
    .input(z.object({ query: z.string().min(1).max(200) }))
    .query(async ({ input }) => {
      return await db.searchProducts(input.query);
    }),
});
