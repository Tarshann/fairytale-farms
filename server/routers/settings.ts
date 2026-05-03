/**
 * Settings Router — site-wide feature flags (checkout enabled, etc.)
 */
import { z } from "zod";
import { publicProcedure, router, adminProcedure, db } from "./_shared";
import { isEmailConfigured, sendContactFormNotification, resetTransporter } from "../_core/email";
import { ENV } from "../_core/env";

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

  emailStatus: adminProcedure.query(() => {
    return {
      configured: isEmailConfigured(),
      contactEmail: ENV.contactEmail,
      smtpUser: ENV.smtpUser || null,
    };
  }),

  sendTestEmail: adminProcedure.mutation(async () => {
    if (!isEmailConfigured()) {
      return { success: false, error: "SMTP is not configured. Set SMTP_HOST, SMTP_USER, and SMTP_PASS in Railway." };
    }
    const timeoutPromise = new Promise<{ ok: false; error: string }>(resolve =>
      setTimeout(() => {
        resetTransporter();
        resolve({ ok: false, error: "Connection timed out after 20s — check SMTP_HOST and SMTP_PORT in Railway." });
      }, 20000)
    );
    const { ok, error } = await Promise.race([
      sendContactFormNotification({
        name: "Test Sender",
        email: ENV.smtpUser || "test@example.com",
        subject: "Test: Contact Form Forwarding",
        message: "This is a test message to verify that contact form emails are being forwarded correctly.",
      }),
      timeoutPromise,
    ]);
    if (ok) {
      return { success: true, error: null };
    }
    return { success: false, error: error ?? "SMTP send failed — check Railway logs for details." };
  }),
});
