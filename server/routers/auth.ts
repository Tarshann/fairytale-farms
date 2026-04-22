/**
 * Auth Router — passwordless email login (request code / verify code / logout)
 */
import { z } from "zod";
import crypto from "crypto";
import { COOKIE_NAME, SESSION_MAX_MS } from "@shared/const";
import { getSessionCookieOptions } from "../_core/cookies";
import { sdk } from "../_core/sdk";
import { sendLoginCode } from "../_core/email";
import { TRPCError } from "@trpc/server";
import { publicProcedure, router } from "./_shared";
import { db, ENV, getClientIp } from "./_shared";
import { checkRateLimit } from "../_core/rateLimit";
import type { Request } from "express";

// ─── Rate Limiting (Redis-backed via shared rateLimit module) ─────────────────
const LOGIN_RATE_LIMIT_WINDOW_MS = 10 * 60_000; // 10 minutes
const LOGIN_RATE_LIMIT_MAX = 5;

const enforceLoginRateLimit = async (req: Request, email: string) => {
  const key = `login:${getClientIp(req)}:${email.toLowerCase()}`;
  const result = await checkRateLimit(key, LOGIN_RATE_LIMIT_MAX, LOGIN_RATE_LIMIT_WINDOW_MS);
  if (!result.allowed) {
    const retryAfterSeconds = Math.max(1, Math.ceil((result.retryAfterMs ?? 60_000) / 1000));
    throw new TRPCError({
      code: "TOO_MANY_REQUESTS",
      message: `Too many login attempts. Try again in ${retryAfterSeconds}s.`,
    });
  }
};

// ─── Router ───────────────────────────────────────────────────────────────────
export const authRouter = router({
  me: publicProcedure.query(opts => opts.ctx.user),

  logout: publicProcedure.mutation(({ ctx }) => {
    const cookieOptions = getSessionCookieOptions(ctx.req);
    ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
    return { success: true } as const;
  }),

  requestLoginCode: publicProcedure
    .input(z.object({ email: z.string().email().max(254).trim() }))
    .mutation(async ({ input, ctx }) => {
      await enforceLoginRateLimit(ctx.req, input.email);
      const code = crypto.randomInt(100000, 1000000).toString();
      const normalizedEmail = input.email.trim().toLowerCase();
      const hash = crypto
        .createHash("sha256")
        .update(`${normalizedEmail}:${code}`)
        .digest("hex");
      const expiresAt = new Date(Date.now() + 10 * 60_000);
      await db.invalidateLoginCodesForEmail(normalizedEmail);
      await db.createLoginCode({ email: normalizedEmail, codeHash: hash, expiresAt });
      const emailSent = await sendLoginCode(normalizedEmail, code);
      const showDevCode = !emailSent && !ENV.isProduction;
      return {
        success: true,
        expiresAt: expiresAt.toISOString(),
        devCode: showDevCode ? code : undefined,
        emailSent,
      };
    }),

  verifyLoginCode: publicProcedure
    .input(z.object({ email: z.string().email().max(254).trim(), code: z.string().min(6).max(6) }))
    .mutation(async ({ input, ctx }) => {
      await enforceLoginRateLimit(ctx.req, input.email);
      const normalizedEmail = input.email.trim().toLowerCase();
      const record = await db.getLatestActiveLoginCode(normalizedEmail);
      if (!record) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid or expired code." });
      }
      const hash = crypto
        .createHash("sha256")
        .update(`${normalizedEmail}:${input.code}`)
        .digest("hex");
      if (hash !== record.codeHash) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid or expired code." });
      }
      await db.markLoginCodeUsed(record.id);
      const openId = `email:${normalizedEmail}`;
      await db.upsertUser({
        openId,
        email: normalizedEmail,
        name: normalizedEmail.split("@")[0],
        loginMethod: "email",
        lastSignedIn: new Date(),
      });
      const accountUser = await db.getUserByOpenId(openId);
      if (!accountUser) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Unable to sign in." });
      }
      if (ctx.user?.loginMethod === "guest") {
        await db.transferCartItems(ctx.user.id, accountUser.id);
      }
      const sessionToken = await sdk.createSessionToken(openId, {
        name: accountUser.name ?? "",
        expiresInMs: SESSION_MAX_MS,
      });
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: SESSION_MAX_MS });
      return { success: true };
    }),
});
