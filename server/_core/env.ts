/**
 * env.ts — centralised environment configuration.
 *
 * Security notes:
 *  - Admin emails are loaded exclusively from the ADMIN_EMAILS env var.
 *    No email addresses are hardcoded in source code.
 *  - JWT_SECRET is required in production; the server will refuse to start
 *    without it to prevent insecure session signing.
 */

const parseAdminEmails = (raw: string) =>
  raw
    .split(",")
    .map(value => value.trim().toLowerCase())
    .filter(Boolean);

const allowDevLogin =
  process.env.DEV_LOGIN_ENABLED === "true" ||
  process.env.ALLOW_DEV_LOGIN === "true";
const rawAppId = process.env.VITE_APP_ID ?? "";
const rawCookieSecret = process.env.JWT_SECRET ?? "";
const nodeEnv = process.env.NODE_ENV ?? "development";
const isProduction = nodeEnv === "production";
const oAuthServerUrl = (process.env.OAUTH_SERVER_URL ?? "").trim();
// Public app URL for redirects (e.g. Stripe). Prefer APP_ORIGIN; fall back to OAUTH_SERVER_URL.
const appOrigin = (process.env.APP_ORIGIN ?? process.env.OAUTH_SERVER_URL ?? "")
  .trim();

// ─── Hard startup crash for missing critical secrets in production ────────────
if (isProduction && !rawCookieSecret) {
  console.error(
    "[env] FATAL: JWT_SECRET is not set in production. Refusing to start with an insecure session secret. Set JWT_SECRET in your Railway environment variables immediately."
  );
  process.exit(1);
}

export const ENV = {
  appId: rawAppId || "fairytale-farms",
  cookieSecret:
    rawCookieSecret ||
    (allowDevLogin
      ? "dev-secret"
      : "fairytale-farms-fallback-please-set-JWT_SECRET"),
  databaseUrl: (process.env.DATABASE_URL ?? "").trim(),
  /** Canonical app URL for production (e.g. https://fairytalefarms.net). Used for checkout redirects when request origin is missing. */
  appOrigin: appOrigin || null,
  oAuthServerUrl,
  oauthEnabled: Boolean(oAuthServerUrl),
  ownerOpenId: (process.env.OWNER_OPEN_ID ?? "").trim(),
  ownerEmail: (process.env.OWNER_EMAIL ?? process.env.ADMIN_EMAIL ?? "")
    .trim()
    .toLowerCase(),
  /**
   * Admin emails are loaded exclusively from the ADMIN_EMAILS environment variable.
   * Format: comma-separated list of lowercase email addresses.
   * Example: ADMIN_EMAILS=owner@example.com,admin@example.com
   */
  adminEmails: parseAdminEmails(process.env.ADMIN_EMAILS ?? ""),
  allowDevLogin,
  isProduction,
  forgeApiUrl: (process.env.BUILT_IN_FORGE_API_URL ?? "").trim(),
  forgeApiKey: (process.env.BUILT_IN_FORGE_API_KEY ?? "").trim(),
  smtpHost: (process.env.SMTP_HOST ?? "").trim(),
  smtpPort: Number(process.env.SMTP_PORT ?? "587"),
  smtpUser: (process.env.SMTP_USER ?? "").trim(),
  smtpPass: (process.env.SMTP_PASS ?? "").trim(),
  smtpFrom: (process.env.SMTP_FROM ?? "").trim(),
  /** Resend API key — preferred over SMTP when set (avoids Railway SMTP port blocks) */
  resendApiKey: (process.env.RESEND_API_KEY ?? "").trim(),
  /** Resend verified sender address. Defaults to onboarding@resend.dev (works without domain verification). */
  resendFrom: (process.env.RESEND_FROM ?? "Fairytale Farms <onboarding@resend.dev>").trim(),
  /** Email address where contact form submissions are forwarded */
  contactEmail: (process.env.CONTACT_EMAIL ?? "fairytalefarms.net@gmail.com").trim(),
  // ─── SMS (Twilio) — all optional; SMS is a no-op when unset ────────────────
  /** Twilio Account SID (starts with AC...) */
  twilioAccountSid: (process.env.TWILIO_ACCOUNT_SID ?? "").trim(),
  /** Twilio Auth Token */
  twilioAuthToken: (process.env.TWILIO_AUTH_TOKEN ?? "").trim(),
  /** Sending phone number in E.164 (e.g. +16155551234) OR a Messaging Service SID (MG...) */
  twilioFrom: (process.env.TWILIO_FROM_NUMBER ?? "").trim(),
  /** Owner phone(s) for new-order SMS alerts — comma-separated E.164 numbers */
  adminSmsTo: (process.env.ADMIN_SMS_TO ?? "")
    .split(",")
    .map(v => v.trim())
    .filter(Boolean),
  /** Public base URL for static assets — set to a CDN (e.g. CloudFront) to offload images */
  assetCdnUrl: (process.env.ASSET_CDN_URL ?? "").trim().replace(/\/+$/, ""),
  /** Stripe secret key for server-side API calls */
  stripeSecretKey: (process.env.STRIPE_SECRET_KEY ?? "").trim() || null,
  /** Stripe webhook signing secret for verifying webhook events */
  stripeWebhookSecret: (process.env.STRIPE_WEBHOOK_SECRET ?? "").trim() || null,
};

if (ENV.isProduction && !ENV.oauthEnabled) {
  console.warn(
    "[env] OAUTH_SERVER_URL is not set in production. Login/OAuth will be disabled. Set OAUTH_SERVER_URL to your app origin (e.g. https://fairytalefarms.net) to enable login."
  );
}

if (!rawCookieSecret && !isProduction) {
  console.warn(
    "[env] JWT_SECRET is not set. Using fallback secret — sessions will not survive server restarts. Set JWT_SECRET in Railway environment variables."
  );
}

if (isProduction && !ENV.stripeSecretKey) {
  console.error(
    "[env] CRITICAL: STRIPE_SECRET_KEY is not set in production. Payments will fail."
  );
}

if (isProduction && !ENV.stripeWebhookSecret) {
  console.error(
    "[env] CRITICAL: STRIPE_WEBHOOK_SECRET is not set in production. Webhook signature verification will fail."
  );
}

if (isProduction && ENV.adminEmails.length === 0) {
  console.warn(
    "[env] WARNING: ADMIN_EMAILS is not set. No users will be automatically promoted to admin. Set ADMIN_EMAILS=owner@example.com in your environment variables."
  );
}
