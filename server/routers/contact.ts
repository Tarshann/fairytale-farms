/**
 * Contact Router — public form submission and admin contact management
 */
import { z } from "zod";
import { publicProcedure, router, adminProcedure, db } from "./_shared";
import { sendContactFormNotification } from "../_core/email";

export const contactRouter = router({
  submit: publicProcedure
    .input(
      z.object({
        name: z.string().min(1).max(100).trim(),
        email: z.string().email().max(254).trim(),
        phone: z.string().max(30).trim().optional(),
        subject: z.string().max(200).trim().optional(),
        message: z.string().min(1).max(5000).trim(),
      })
    )
    .mutation(async ({ input }) => {
      const id = await db.createContactSubmission(input);
      const emailSent = await sendContactFormNotification(input);
      if (!emailSent) {
        console.warn("[Contact] Email notification not sent for submission id:", id);
      }
      return { id, success: true, emailSent };
    }),

  list: adminProcedure.query(async () => {
    return await db.getAllContactSubmissions();
  }),

  updateStatus: adminProcedure
    .input(z.object({ id: z.number(), status: z.enum(["new", "read", "replied"]) }))
    .mutation(async ({ input }) => {
      await db.updateContactSubmissionStatus(input.id, input.status);
      return { success: true };
    }),
});
