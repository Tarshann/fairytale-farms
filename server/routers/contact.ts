/**
 * Contact Router — public form submission and admin contact management
 */
import { z } from "zod";
import { publicProcedure, router, adminProcedure, db } from "./_shared";

export const contactRouter = router({
  submit: publicProcedure
    .input(
      z.object({
        name: z.string(),
        email: z.string().email(),
        phone: z.string().optional(),
        subject: z.string().optional(),
        message: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const id = await db.createContactSubmission(input);
      return { id, success: true };
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
