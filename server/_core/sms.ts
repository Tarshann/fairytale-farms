/**
 * sms.ts — optional Twilio SMS notifications.
 *
 * Mirrors the email module's contract: every function is a safe no-op when
 * Twilio credentials are not configured, and never throws into a caller.
 * Calls Twilio's REST API directly via fetch (no SDK dependency — consistent
 * with _core/notification.ts), so nothing needs to be installed to ship this.
 *
 * Activation: set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER
 * (a Twilio number in E.164, or a Messaging Service SID), and optionally
 * ADMIN_SMS_TO for owner new-order alerts. See .env.example.
 */
import { ENV } from "./env";

export function isSmsConfigured(): boolean {
  return Boolean(ENV.twilioAccountSid && ENV.twilioAuthToken && ENV.twilioFrom);
}

/** Normalize a phone string to E.164-ish; returns null if it can't be used. */
export function normalizePhone(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  // Already E.164.
  if (/^\+[1-9]\d{6,14}$/.test(trimmed)) return trimmed;
  // Bare US 10-digit or 1+10-digit → prefix +1.
  const digits = trimmed.replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  return null;
}

/**
 * Send a single SMS. Returns true on accepted, false on any failure or when
 * SMS is not configured. Never throws.
 */
export async function sendSms(to: string, body: string): Promise<boolean> {
  if (!isSmsConfigured()) return false;
  const dest = normalizePhone(to);
  if (!dest) {
    console.warn("[SMS] Skipping — unusable destination number:", to);
    return false;
  }

  const url = `https://api.twilio.com/2010-04-01/Accounts/${ENV.twilioAccountSid}/Messages.json`;
  const params = new URLSearchParams();
  params.set("To", dest);
  // A Messaging Service SID (MG...) uses MessagingServiceSid; a number uses From.
  if (ENV.twilioFrom.startsWith("MG")) {
    params.set("MessagingServiceSid", ENV.twilioFrom);
  } else {
    params.set("From", ENV.twilioFrom);
  }
  params.set("Body", body.slice(0, 1500));

  const auth = Buffer.from(
    `${ENV.twilioAccountSid}:${ENV.twilioAuthToken}`
  ).toString("base64");

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
      // Don't let a slow carrier hang the webhook.
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      console.warn(
        `[SMS] Send failed (${res.status})${detail ? `: ${detail}` : ""}`
      );
      return false;
    }
    console.log("[SMS] Sent to:", dest);
    return true;
  } catch (err) {
    console.warn(
      "[SMS] Error sending:",
      err instanceof Error ? err.message : String(err)
    );
    return false;
  }
}

const appOrigin = () => ENV.appOrigin || "https://fairytalefarms.net";

/** Owner alert when a new order lands. Sends to every number in ADMIN_SMS_TO. */
export async function sendAdminOrderSms(data: {
  orderNumber: string;
  customerName: string;
  totalAmount: string;
}): Promise<boolean> {
  if (!isSmsConfigured() || ENV.adminSmsTo.length === 0) return false;
  const body = `🎂 New Fairytale Farms order #${data.orderNumber} from ${data.customerName} — $${parseFloat(data.totalAmount).toFixed(2)}. View: ${appOrigin()}/admin/orders`;
  const results = await Promise.all(
    ENV.adminSmsTo.map(to => sendSms(to, body))
  );
  return results.some(Boolean);
}

/** Customer confirmation SMS (only sent if we captured a phone). */
export async function sendOrderConfirmationSms(data: {
  customerPhone: string | null | undefined;
  orderNumber: string;
  customerName: string;
}): Promise<boolean> {
  if (!data.customerPhone) return false;
  const body = `Hi ${data.customerName}! Fairytale Farms received your order #${data.orderNumber}. We're on it 🧁 Track it: ${appOrigin()}/my-orders`;
  return sendSms(data.customerPhone, body);
}

const STATUS_SMS: Record<string, (n: string) => string> = {
  processing: n =>
    `Good news! Your Fairytale Farms order #${n} is now being prepared 👩‍🍳`,
  completed: n =>
    `Your Fairytale Farms order #${n} is ready! 🎉 ${appOrigin()}/my-orders`,
  cancelled: n =>
    `Your Fairytale Farms order #${n} has been cancelled. Questions? Reply to this message.`,
};

/** Customer SMS on an order status change. */
export async function sendOrderStatusSms(data: {
  customerPhone: string | null | undefined;
  orderNumber: string;
  status: "processing" | "completed" | "cancelled";
}): Promise<boolean> {
  if (!data.customerPhone) return false;
  const make = STATUS_SMS[data.status];
  if (!make) return false;
  return sendSms(data.customerPhone, make(data.orderNumber));
}
