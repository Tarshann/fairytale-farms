/**
 * AI Router — demand forecasting, low stock alerts, pricing recommendations, marketing campaigns
 */
import { z } from "zod";
import { router, adminProcedure, db } from "./_shared";

export const aiRouter = router({
  demandForecast: adminProcedure.query(async () => {
    const [velocity, revenue] = await Promise.all([
      db.getOrderVelocityByProduct(30),
      db.getRevenueByDay(30),
    ]);
    return { velocity, revenue };
  }),

  lowStockAlerts: adminProcedure.query(async () => {
    return await db.getActiveLowStockAlerts();
  }),

  resolveLowStockAlert: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await db.resolveLowStockAlert(input.id);
      return { success: true };
    }),

  pricingRecommendations: adminProcedure.query(async () => {
    return await db.getPendingPricingRecommendations();
  }),

  allPricingRecommendations: adminProcedure.query(async () => {
    return await db.getAllPricingRecommendations();
  }),

  applyPricingRecommendation: adminProcedure
    .input(z.object({ id: z.number(), productId: z.number(), newPrice: z.string() }))
    .mutation(async ({ input }) => {
      await db.updateProduct(input.productId, { basePrice: input.newPrice });
      await db.updatePricingRecommendationStatus(input.id, "applied");
      return { success: true };
    }),

  rejectPricingRecommendation: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await db.updatePricingRecommendationStatus(input.id, "rejected");
      return { success: true };
    }),

  marketingCampaigns: adminProcedure.query(async () => {
    return await db.getAllMarketingCampaigns();
  }),

  updateCampaignStatus: adminProcedure
    .input(
      z.object({
        id: z.number(),
        status: z.enum(["draft", "approved", "published", "rejected"]),
      })
    )
    .mutation(async ({ input }) => {
      await db.updateMarketingCampaignStatus(input.id, input.status);
      return { success: true };
    }),

  updateCampaign: adminProcedure
    .input(
      z.object({
        id: z.number(),
        caption: z.string().optional(),
        suggestedImagePrompt: z.string().optional(),
        scheduledFor: z.string().nullable().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { id, scheduledFor, ...rest } = input;
      const updates: Record<string, unknown> = { ...rest };
      if (scheduledFor !== undefined) {
        updates.scheduledFor = scheduledFor ? new Date(scheduledFor) : null;
      }
      await db.updateMarketingCampaign(
        id,
        updates as Parameters<typeof db.updateMarketingCampaign>[1]
      );
      return { success: true };
    }),
});
