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

export async function sendLoginCode(
  to: string,
  code: string
): Promise<boolean> {
  const transporter = getTransporter();
  if (!transporter) {
    console.warn("[Email] SMTP not configured — cannot send login code.");
    return false;
  }

  const from = ENV.smtpFrom || ENV.smtpUser;

  try {
    await transporter.sendMail({
      from: `"Fairytale Farms" <${from}>`,
      to,
      subject: "Your Fairytale Farms sign-in code",
      text: `Your sign-in code is: ${code}\n\nThis code expires in 10 minutes. If you didn't request this, you can safely ignore this email.`,
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
          <h2 style="color: #6b4226;">Fairytale Farms</h2>
          <p>Your sign-in code is:</p>
          <p style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #6b4226; padding: 16px 0;">${code}</p>
          <p style="color: #888; font-size: 14px;">This code expires in 10 minutes. If you didn't request this, you can safely ignore this email.</p>
        </div>
      `,
    });
    return true;
  } catch (error) {
    console.error("[Email] Failed to send login code:", error);
    return false;
  }
}
