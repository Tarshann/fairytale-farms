/**
 * Settings Router — site-wide feature flags (checkout enabled, etc.)
 */
import { z } from "zod";
import { publicProcedure, router, adminProcedure, db } from "./_shared";

export const settingsRouter = router({
  checkoutEnabled: publicProcedure.query(async () => {
    return { enabled: await db.isCheckoutEnabled() };
  }),

  setCheckoutEnabled: adminProcedure
    .input(z.object({ enabled: z.boolean() }))
    .mutation(async ({ input }) => {
      await db.setSiteSetting("checkout_enabled", input.enabled.toString());
      return { success: true, enabled: input.enabled };
    }),
});
