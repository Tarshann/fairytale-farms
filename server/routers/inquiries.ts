/**
 * Inquiries Router — admin management of chatbot-generated custom order inquiries
 */
import { z } from "zod";
import { router, adminProcedure } from "./_shared";
import * as chatbotService from "../chatbot";

export const inquiriesRouter = router({
  list: adminProcedure.query(async () => {
    return await chatbotService.getAllInquiries();
  }),

  updateStatus: adminProcedure
    .input(
      z.object({
        id: z.number(),
        status: z.enum(["new", "contacted", "quoted", "confirmed", "completed", "cancelled"]),
        adminNotes: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      await chatbotService.updateInquiryStatus(input.id, input.status, input.adminNotes);
      return { success: true };
    }),

  getConversation: adminProcedure
    .input(z.object({ inquiryId: z.number() }))
    .query(async ({ input }) => {
      return await chatbotService.getInquiryConversation(input.inquiryId);
    }),

  analytics: adminProcedure.query(async () => {
    return await chatbotService.getInquiryAnalytics();
  }),

  bulkUpdateStatus: adminProcedure
    .input(
      z.object({
        ids: z.array(z.number()),
        status: z.enum(["new", "contacted", "quoted", "confirmed", "completed", "cancelled"]),
      })
    )
    .mutation(async ({ input }) => {
      return await chatbotService.bulkUpdateInquiryStatus(input.ids, input.status);
    }),

  overdue: adminProcedure.query(async () => {
    return await chatbotService.getOverdueInquiries();
  }),
});
