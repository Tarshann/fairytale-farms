import nodemailer from "nodemailer";
import { ENV } from "./env";

let _transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter | null {
  if (!ENV.smtpHost || !ENV.smtpUser || !ENV.smtpPass) return null;

  if (!_transporter) {
    _transporter = nodemailer.createTransport({
      host: ENV.smtpHost,
      port: ENV.smtpPort,
      secure: ENV.smtpPort === 465,
      auth: {
        user: ENV.smtpUser,
        pass: ENV.smtpPass,
      },
    });
  }
  return _transporter;
}

export function isEmailConfigured(): boolean {
  return Boolean(ENV.smtpHost && ENV.smtpUser && ENV.smtpPass);
}

// ─── Shared HTML wrapper ─────────────────────────────────────────────────────

function htmlWrap(body: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Fairytale Farms</title>
</head>
<body style="margin:0;padding:0;background:#fdf8f3;font-family:'Georgia',serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#fdf8f3;padding:32px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#6b4226 0%,#a0522d 100%);padding:32px 40px;text-align:center;">
              <h1 style="margin:0;color:#fff;font-size:28px;letter-spacing:2px;">🧁 Fairytale Farms</h1>
              <p style="margin:6px 0 0;color:#f5deb3;font-size:13px;letter-spacing:1px;">ARTISAN BAKERY · CASTALIAN SPRINGS, TN</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              ${body}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background:#fdf8f3;padding:24px 40px;text-align:center;border-top:1px solid #f0e0d0;">
              <p style="margin:0;color:#a0522d;font-size:13px;">Questions? Reply to this email or contact us at <a href="mailto:fairytalefarms.net@gmail.com" style="color:#6b4226;">fairytalefarms.net@gmail.com</a></p>
              <p style="margin:8px 0 0;color:#c8a882;font-size:12px;">© ${new Date().getFullYear()} Fairytale Farms · All rights reserved</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function btn(text: string, url: string): string {
  return `<a href="${url}" style="display:inline-block;background:#6b4226;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-size:15px;font-weight:bold;letter-spacing:0.5px;margin:16px 0;">${text}</a>`;
}

function divider(): string {
  return `<hr style="border:none;border-top:1px solid #f0e0d0;margin:24px 0;" />`;
}

function itemsTable(
  items: Array<{ name: string; quantity: number; price: string; customizationNotes?: string | null }>
): string {
  const rows = items
    .map(
      item => `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid #f5ede4;">
        <strong style="color:#3d2010;">${item.name}</strong>
        ${item.customizationNotes ? `<br/><span style="color:#888;font-size:13px;">Note: ${item.customizationNotes}</span>` : ""}
      </td>
      <td style="padding:10px 0;border-bottom:1px solid #f5ede4;text-align:center;color:#6b4226;">×${item.quantity}</td>
      <td style="padding:10px 0;border-bottom:1px solid #f5ede4;text-align:right;font-weight:bold;color:#3d2010;">${item.price}</td>
    </tr>`
    )
    .join("");

  return `
  <table width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;">
    <thead>
      <tr>
        <th style="text-align:left;color:#a0522d;font-size:12px;text-transform:uppercase;letter-spacing:1px;padding-bottom:8px;">Item</th>
        <th style="text-align:center;color:#a0522d;font-size:12px;text-transform:uppercase;letter-spacing:1px;padding-bottom:8px;">Qty</th>
        <th style="text-align:right;color:#a0522d;font-size:12px;text-transform:uppercase;letter-spacing:1px;padding-bottom:8px;">Total</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>`;
}

// ─── 1. Login Code ────────────────────────────────────────────────────────────

export async function sendLoginCode(to: string, code: string): Promise<boolean> {
  const transporter = getTransporter();
  if (!transporter) {
    console.warn("[Email] SMTP not configured — cannot send login code.");
    return false;
  }

  const from = ENV.smtpFrom || ENV.smtpUser;
  const html = htmlWrap(`
    <h2 style="color:#6b4226;margin:0 0 8px;">Your Sign-In Code</h2>
    <p style="color:#555;margin:0 0 24px;">Use the code below to sign in to your Fairytale Farms account. It expires in <strong>10 minutes</strong>.</p>
    <div style="background:#fdf8f3;border:2px dashed #c8a882;border-radius:10px;padding:24px;text-align:center;margin:0 0 24px;">
      <span style="font-size:40px;font-weight:bold;letter-spacing:10px;color:#6b4226;">${code}</span>
    </div>
    <p style="color:#888;font-size:13px;">If you didn't request this, you can safely ignore this email.</p>
  `);

  try {
    await transporter.sendMail({
      from: `"Fairytale Farms" <${from}>`,
      to,
      subject: "Your Fairytale Farms sign-in code",
      text: `Your sign-in code is: ${code}\n\nThis code expires in 10 minutes.`,
      html,
    });
    return true;
  } catch (error) {
    console.error("[Email] Failed to send login code:", error);
    return false;
  }
}

// ─── 2. Order Confirmation ────────────────────────────────────────────────────

export interface OrderConfirmationData {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  totalAmount: string;
  isDeposit?: boolean;
  remainingAmount?: string | null;
  promoCode?: string | null;
  discountAmount?: string | null;
  deliveryZipCode?: string | null;
  deliveryType?: string | null;
  scheduledDeliveryDate?: Date | null;
  items: Array<{
    name: string;
    quantity: number;
    price: string;
    customizationNotes?: string | null;
  }>;
}

export async function sendOrderConfirmation(data: OrderConfirmationData): Promise<boolean> {
  const transporter = getTransporter();
  if (!transporter) {
    console.warn("[Email] SMTP not configured — skipping order confirmation email.");
    return false;
  }

  const from = ENV.smtpFrom || ENV.smtpUser;
  const appOrigin = ENV.appOrigin || "https://fairytalefarms.net";

  const depositNote = data.isDeposit
    ? `<div style="background:#fff8e1;border-left:4px solid #f59e0b;padding:12px 16px;border-radius:4px;margin:16px 0;">
        <strong style="color:#92400e;">Deposit Order</strong> — You paid a 50% deposit of <strong>$${parseFloat(data.totalAmount).toFixed(2)}</strong>.
        The remaining balance of <strong>$${parseFloat(data.remainingAmount || "0").toFixed(2)}</strong> will be collected at pickup.
       </div>`
    : "";

  const promoNote =
    data.promoCode && data.discountAmount
      ? `<p style="color:#16a34a;font-size:14px;">✓ Promo code <strong>${data.promoCode}</strong> applied — saved $${parseFloat(data.discountAmount).toFixed(2)}</p>`
      : "";

  const deliveryNote =
    data.deliveryZipCode
      ? `<p style="color:#555;font-size:14px;">📦 Delivery to ZIP <strong>${data.deliveryZipCode}</strong>${data.scheduledDeliveryDate ? ` on <strong>${new Date(data.scheduledDeliveryDate).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</strong>` : ""}</p>`
      : `<p style="color:#555;font-size:14px;">🏠 <strong>Porch pickup</strong> — We'll contact you when your order is ready in Castalian Springs, TN.</p>`;

  const html = htmlWrap(`
    <h2 style="color:#6b4226;margin:0 0 4px;">Order Confirmed! 🎂</h2>
    <p style="color:#555;margin:0 0 24px;">Hi ${data.customerName}, thank you for your order. We're so excited to bake for you!</p>

    <div style="background:#fdf8f3;border-radius:8px;padding:16px 20px;margin:0 0 20px;">
      <p style="margin:0;font-size:13px;color:#a0522d;text-transform:uppercase;letter-spacing:1px;">Order Number</p>
      <p style="margin:4px 0 0;font-size:22px;font-weight:bold;color:#3d2010;">#${data.orderNumber}</p>
    </div>

    ${depositNote}
    ${promoNote}
    ${itemsTable(data.items)}

    <div style="text-align:right;padding:8px 0;">
      <span style="font-size:18px;font-weight:bold;color:#3d2010;">Total: $${parseFloat(data.totalAmount).toFixed(2)}</span>
    </div>

    ${divider()}
    ${deliveryNote}
    ${divider()}

    <p style="color:#555;font-size:14px;">Want to check your order status or reorder?</p>
    ${btn("View My Orders", `${appOrigin}/my-orders`)}
  `);

  const text = `Order Confirmed! #${data.orderNumber}\n\nHi ${data.customerName},\n\nThank you for your order from Fairytale Farms!\n\nItems:\n${data.items.map(i => `• ${i.name} ×${i.quantity} — ${i.price}`).join("\n")}\n\nTotal: $${parseFloat(data.totalAmount).toFixed(2)}\n\nWe'll be in touch soon!`;

  try {
    await transporter.sendMail({
      from: `"Fairytale Farms" <${from}>`,
      to: data.customerEmail,
      subject: `Order Confirmed! #${data.orderNumber} — Fairytale Farms`,
      text,
      html,
    });
    console.log("[Email] Order confirmation sent to:", data.customerEmail);
    return true;
  } catch (error) {
    console.error("[Email] Failed to send order confirmation:", error);
    return false;
  }
}

// ─── 3. Order Status Update ───────────────────────────────────────────────────

export interface OrderStatusUpdateData {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  status: "processing" | "completed" | "cancelled";
  adminNote?: string | null;
}

const STATUS_LABELS: Record<string, { emoji: string; label: string; color: string; message: string }> = {
  processing: {
    emoji: "👩‍🍳",
    label: "Being Prepared",
    color: "#2563eb",
    message: "Great news! Your order is now being prepared by our bakers. We'll let you know when it's ready!",
  },
  completed: {
    emoji: "✅",
    label: "Ready for Pickup",
    color: "#16a34a",
    message: "Your order is ready! Please come pick it up at our location in Castalian Springs, TN. We can't wait for you to enjoy it!",
  },
  cancelled: {
    emoji: "❌",
    label: "Cancelled",
    color: "#dc2626",
    message: "Your order has been cancelled. If you have any questions or would like to place a new order, please don't hesitate to reach out.",
  },
};

export async function sendOrderStatusUpdate(data: OrderStatusUpdateData): Promise<boolean> {
  const transporter = getTransporter();
  if (!transporter) return false;

  const from = ENV.smtpFrom || ENV.smtpUser;
  const appOrigin = ENV.appOrigin || "https://fairytalefarms.net";
  const info = STATUS_LABELS[data.status] ?? STATUS_LABELS.processing;

  const adminNoteHtml = data.adminNote
    ? `<div style="background:#f0f9ff;border-left:4px solid #0ea5e9;padding:12px 16px;border-radius:4px;margin:16px 0;">
        <strong style="color:#0369a1;">Note from our team:</strong>
        <p style="margin:4px 0 0;color:#555;">${data.adminNote}</p>
       </div>`
    : "";

  const html = htmlWrap(`
    <h2 style="color:${info.color};margin:0 0 4px;">${info.emoji} Order ${info.label}</h2>
    <p style="color:#555;margin:0 0 24px;">Hi ${data.customerName}, here's an update on your order.</p>

    <div style="background:#fdf8f3;border-radius:8px;padding:16px 20px;margin:0 0 20px;">
      <p style="margin:0;font-size:13px;color:#a0522d;text-transform:uppercase;letter-spacing:1px;">Order Number</p>
      <p style="margin:4px 0 0;font-size:22px;font-weight:bold;color:#3d2010;">#${data.orderNumber}</p>
    </div>

    <p style="color:#555;">${info.message}</p>
    ${adminNoteHtml}
    ${divider()}
    ${btn("View Order Details", `${appOrigin}/my-orders`)}
  `);

  try {
    await transporter.sendMail({
      from: `"Fairytale Farms" <${from}>`,
      to: data.customerEmail,
      subject: `${info.emoji} Order #${data.orderNumber} — ${info.label}`,
      text: `Hi ${data.customerName},\n\nYour order #${data.orderNumber} is now: ${info.label}\n\n${info.message}${data.adminNote ? `\n\nNote: ${data.adminNote}` : ""}`,
      html,
    });
    return true;
  } catch (error) {
    console.error("[Email] Failed to send order status update:", error);
    return false;
  }
}

// ─── 4. Abandoned Cart Recovery ───────────────────────────────────────────────

export interface AbandonedCartEmailData {
  customerName: string;
  customerEmail: string;
  items: Array<{ name: string; quantity: number; price: string }>;
  cartTotal: string;
}

export async function sendAbandonedCartEmail(data: AbandonedCartEmailData): Promise<boolean> {
  const transporter = getTransporter();
  if (!transporter) return false;

  const from = ENV.smtpFrom || ENV.smtpUser;
  const appOrigin = ENV.appOrigin || "https://fairytalefarms.net";

  const html = htmlWrap(`
    <h2 style="color:#6b4226;margin:0 0 4px;">You left something behind! 🧁</h2>
    <p style="color:#555;margin:0 0 24px;">Hi ${data.customerName}, you have items waiting in your cart. Your baked goods are ready to order!</p>

    ${itemsTable(data.items)}

    <div style="text-align:right;padding:8px 0 16px;">
      <span style="font-size:18px;font-weight:bold;color:#3d2010;">Cart Total: $${parseFloat(data.cartTotal).toFixed(2)}</span>
    </div>

    ${divider()}
    <p style="color:#555;font-size:14px;">Our treats are made fresh to order — don't miss out!</p>
    ${btn("Complete My Order", `${appOrigin}/cart`)}
    <p style="color:#aaa;font-size:12px;margin-top:16px;">If you no longer wish to receive these reminders, simply ignore this email.</p>
  `);

  try {
    await transporter.sendMail({
      from: `"Fairytale Farms" <${from}>`,
      to: data.customerEmail,
      subject: "🧁 You left something in your cart — Fairytale Farms",
      text: `Hi ${data.customerName},\n\nYou have items waiting in your cart at Fairytale Farms!\n\n${data.items.map(i => `• ${i.name} ×${i.quantity}`).join("\n")}\n\nCart Total: $${parseFloat(data.cartTotal).toFixed(2)}\n\nComplete your order: ${appOrigin}/cart`,
      html,
    });
    return true;
  } catch (error) {
    console.error("[Email] Failed to send abandoned cart email:", error);
    return false;
  }
}

// ─── 5. Review Request ────────────────────────────────────────────────────────

export interface ReviewRequestData {
  customerName: string;
  customerEmail: string;
  orderNumber: string;
  items: Array<{ name: string; productSlug: string }>;
}

export async function sendReviewRequestEmail(data: ReviewRequestData): Promise<boolean> {
  const transporter = getTransporter();
  if (!transporter) return false;

  const from = ENV.smtpFrom || ENV.smtpUser;
  const appOrigin = ENV.appOrigin || "https://fairytalefarms.net";

  const productLinks = data.items
    .map(
      item =>
        `<li style="margin:8px 0;"><a href="${appOrigin}/products/${item.productSlug}" style="color:#6b4226;font-weight:bold;">${item.name}</a></li>`
    )
    .join("");

  const html = htmlWrap(`
    <h2 style="color:#6b4226;margin:0 0 4px;">How was your order? ⭐</h2>
    <p style="color:#555;margin:0 0 24px;">Hi ${data.customerName}, we hope you loved your order #${data.orderNumber}! Your feedback means the world to our small family bakery.</p>

    <p style="color:#555;">Please take a moment to review your items:</p>
    <ul style="padding-left:20px;color:#555;">${productLinks}</ul>

    ${divider()}
    ${btn("Leave a Review", `${appOrigin}/my-orders`)}
    <p style="color:#aaa;font-size:12px;margin-top:16px;">Reviews help other customers discover our baked goods. Thank you! 🧁</p>
  `);

  try {
    await transporter.sendMail({
      from: `"Fairytale Farms" <${from}>`,
      to: data.customerEmail,
      subject: `How was your order? — Fairytale Farms`,
      text: `Hi ${data.customerName},\n\nWe hope you loved your order #${data.orderNumber}! Please leave a review at ${appOrigin}/my-orders`,
      html,
    });
    return true;
  } catch (error) {
    console.error("[Email] Failed to send review request email:", error);
    return false;
  }
}

// ─── 6. Admin: New Order Notification ────────────────────────────────────────

export async function sendAdminOrderNotification(data: OrderConfirmationData): Promise<boolean> {
  const transporter = getTransporter();
  if (!transporter) return false;

  const adminEmails = ENV.adminEmails;
  if (!adminEmails.length) return false;

  const from = ENV.smtpFrom || ENV.smtpUser;
  const appOrigin = ENV.appOrigin || "https://fairytalefarms.net";

  const html = htmlWrap(`
    <h2 style="color:#6b4226;margin:0 0 4px;">🎂 New Order Received!</h2>
    <p style="color:#555;margin:0 0 24px;">A new order has been placed on Fairytale Farms.</p>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;">
      <tr><td style="color:#a0522d;width:140px;padding:6px 0;font-size:14px;">Order Number</td><td style="font-weight:bold;color:#3d2010;font-size:14px;">#${data.orderNumber}</td></tr>
      <tr><td style="color:#a0522d;padding:6px 0;font-size:14px;">Customer</td><td style="color:#3d2010;font-size:14px;">${data.customerName}</td></tr>
      <tr><td style="color:#a0522d;padding:6px 0;font-size:14px;">Email</td><td style="color:#3d2010;font-size:14px;">${data.customerEmail}</td></tr>
      <tr><td style="color:#a0522d;padding:6px 0;font-size:14px;">Total</td><td style="font-weight:bold;color:#3d2010;font-size:14px;">$${parseFloat(data.totalAmount).toFixed(2)}</td></tr>
    </table>

    ${itemsTable(data.items)}
    ${divider()}
    ${btn("View in Admin", `${appOrigin}/admin/orders`)}
  `);

  try {
    await transporter.sendMail({
      from: `"Fairytale Farms" <${from}>`,
      to: adminEmails,
      subject: `🎂 New Order #${data.orderNumber} — $${parseFloat(data.totalAmount).toFixed(2)}`,
      text: `New order #${data.orderNumber} from ${data.customerName} (${data.customerEmail})\nTotal: $${parseFloat(data.totalAmount).toFixed(2)}`,
      html,
    });
    return true;
  } catch (error) {
    console.error("[Email] Failed to send admin order notification:", error);
    return false;
  }
}
