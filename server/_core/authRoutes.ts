import type { Express, Request, Response } from "express";
import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { ENV } from "./env";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";
import * as db from "../db";
import { createLoginCode, verifyLoginCode } from "./authCodes";

function json(res: Response, status: number, body: Record<string, unknown>) {
  res.status(status).json(body);
}

function getIp(req: Request): string {
  const xf = req.headers["x-forwarded-for"];
  if (typeof xf === "string" && xf.length > 0) return xf.split(",")[0].trim();
  return req.socket.remoteAddress || "";
}

export function registerAuthRoutes(app: Express) {
  app.post("/api/auth/request-code", async (req: Request, res: Response) => {
    const emailRaw = String(req.body?.email ?? "");
    const email = emailRaw.trim().toLowerCase();

    if (!email) return json(res, 400, { error: "email is required" });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return json(res, 400, { error: "invalid email" });
    }

    const secret = ENV.cookieSecret || process.env.JWT_SECRET || "dev-secret";

    const { code, expiresAt, codeHash } = createLoginCode(email, secret, 15);

    await db.createPasswordlessLoginCode({
      email,
      codeHash,
      expiresAt,
      ip: getIp(req),
      userAgent: String(req.headers["user-agent"] ?? ""),
    });

    if (!ENV.isProduction) {
      return json(res, 200, {
        ok: true,
        devCode: code,
        expiresAt: expiresAt.toISOString(),
      });
    }

    return json(res, 501, {
      error:
        "Email sender not configured for production. Implement sendEmail in /api/auth/request-code.",
    });
  });

  app.post("/api/auth/verify-code", async (req: Request, res: Response) => {
    const emailRaw = String(req.body?.email ?? "");
    const codeRaw = String(req.body?.code ?? "");
    const email = emailRaw.trim().toLowerCase();
    const code = codeRaw.trim();

    if (!email || !code) {
      return json(res, 400, { error: "email and code are required" });
    }

    const secret = ENV.cookieSecret || process.env.JWT_SECRET || "dev-secret";

    const record = await db.consumePasswordlessLoginCode({ email });

    if (!record) {
      return json(res, 400, {
        error: "No active code found. Request a new code.",
      });
    }

    const now = new Date();
    if (record.expiresAt.getTime() < now.getTime()) {
      return json(res, 400, { error: "Code expired. Request a new code." });
    }

    const ok = verifyLoginCode(email, code, secret, record.codeHash);
    if (!ok) {
      return json(res, 400, { error: "Invalid code." });
    }

    const openId = `email:${email}`;
    const displayName = email.split("@")[0];

    await db.upsertUser({
      openId,
      name: displayName,
      email,
      loginMethod: "code",
      lastSignedIn: new Date(),
    });

    await db.attachGuestOrdersByEmail({ email, openId });

    const sessionToken = await sdk.createSessionToken(openId, {
      name: displayName,
      expiresInMs: ONE_YEAR_MS,
    });

    const cookieOptions = getSessionCookieOptions(req);
    res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

    return json(res, 200, { ok: true });
  });
}
