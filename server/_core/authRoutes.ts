import type { Express, Request, Response } from "express";
import { COOKIE_NAME } from "@shared/const";
import { ENV } from "./env";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";
import * as db from "../db";
import { createLoginCode, hashLoginCode } from "./authCodes";
import { sendLoginCode } from "./email";

function json(res: Response, status: number, body: Record<string, unknown>) {
  res.status(status).json(body);
}

type RateLimitState = {
  count: number;
  resetAt: number;
};

const requestIpLimits = new Map<string, RateLimitState>();
const requestEmailLimits = new Map<string, RateLimitState>();
const verifyIpLimits = new Map<string, RateLimitState>();
const verifyEmailLimits = new Map<string, RateLimitState>();

const REQUEST_IP_MAX = 10;
const REQUEST_EMAIL_MAX = 3;
const VERIFY_IP_MAX = 15;
const VERIFY_EMAIL_MAX = 5;
const WINDOW_MS = 60_000;
const CODE_TTL_MINUTES = 15;
const CODE_LOGIN_SESSION_MS = 30 * 24 * 60 * 60 * 1000;

function enforceRateLimit(
  store: Map<string, RateLimitState>,
  key: string,
  max: number,
  windowMs: number
) {
  if (!key) return;

  const now = Date.now();
  const state = store.get(key);
  if (!state || state.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return;
  }

  if (state.count >= max) {
    throw new Error("rate_limit");
  }

  state.count += 1;
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

    try {
      const ip = getIp(req);
      enforceRateLimit(requestIpLimits, ip, REQUEST_IP_MAX, WINDOW_MS);
      enforceRateLimit(requestEmailLimits, email, REQUEST_EMAIL_MAX, WINDOW_MS);
    } catch {
      return json(res, 429, {
        error: "Too many requests. Please wait and try again.",
      });
    }

    const { code, expiresAt, codeHash } = createLoginCode(
      email,
      CODE_TTL_MINUTES
    );

    await db.createPasswordlessLoginCode({
      email,
      codeHash,
      expiresAt,
      ip: getIp(req),
      userAgent: String(req.headers["user-agent"] ?? ""),
    });

    await sendLoginCode(email, code);

    if (!ENV.isProduction) {
      return json(res, 200, {
        ok: true,
        devCode: code,
        expiresAt: expiresAt.toISOString(),
        message: "If this email exists, a code was sent.",
      });
    }

    return json(res, 200, {
      ok: true,
      expiresAt: expiresAt.toISOString(),
      message: "If this email exists, a code was sent.",
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

    try {
      const ip = getIp(req);
      enforceRateLimit(verifyIpLimits, ip, VERIFY_IP_MAX, WINDOW_MS);
      enforceRateLimit(verifyEmailLimits, email, VERIFY_EMAIL_MAX, WINDOW_MS);
    } catch {
      return json(res, 429, {
        error: "Too many attempts. Please wait and try again.",
      });
    }

    const codeHash = hashLoginCode(email, code);
    const record = await db.consumePasswordlessLoginCode({ email, codeHash });

    if (!record) {
      return json(res, 400, {
        error: "No active code found. Request a new code.",
      });
    }

    const now = new Date();
    if (record.expiresAt.getTime() < now.getTime()) {
      return json(res, 400, { error: "Code expired. Request a new code." });
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
      expiresInMs: CODE_LOGIN_SESSION_MS,
    });

    const cookieOptions = getSessionCookieOptions(req);
    res.cookie(COOKIE_NAME, sessionToken, {
      ...cookieOptions,
      maxAge: CODE_LOGIN_SESSION_MS,
    });

    return json(res, 200, { ok: true });
  });
}
