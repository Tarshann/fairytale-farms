/**
 * Shared utilities, procedures, and helpers used across all domain routers.
 * Import from this file instead of re-importing from _core/trpc in every router.
 */
import {
  publicProcedure,
  protectedProcedure,
  router,
  sessionProcedure,
} from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import type { Request } from "express";
import * as db from "../db";
import { ENV } from "../_core/env";

// ─── Admin Procedure ──────────────────────────────────────────────────────────
export const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Admin access required",
    });
  }
  return next({ ctx });
});

// ─── IP Helpers ───────────────────────────────────────────────────────────────
export const getClientIp = (req: Request): string => {
  const forwardedFor = req.headers["x-forwarded-for"];
  if (typeof forwardedFor === "string" && forwardedFor.length > 0) {
    return forwardedFor.split(",")[0].trim();
  }
  if (Array.isArray(forwardedFor) && forwardedFor.length > 0) {
    return forwardedFor[0].trim();
  }
  return req.ip || req.socket?.remoteAddress || "unknown";
};

// ─── Safe Origin Helper ─────────────────────────────────────────────────────
/**
 * Returns a validated, safe origin for Stripe checkout redirect URLs.
 * Only allows origins that match the configured APP_ORIGIN or known localhost patterns.
 * Falls back to APP_ORIGIN or the production domain — never trusts raw request headers.
 */
const ALLOWED_ORIGINS_RE = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;
export const getSafeCheckoutOrigin = (req: Request): string => {
  const appOrigin = ENV.appOrigin;
  // In production, always use the configured APP_ORIGIN — never trust the request header.
  if (appOrigin) return appOrigin;
  // In development, allow localhost origins from the request header.
  const reqOrigin = req.headers.origin;
  if (typeof reqOrigin === "string" && ALLOWED_ORIGINS_RE.test(reqOrigin)) {
    return reqOrigin;
  }
  // Final fallback for local dev.
  return "http://localhost:3000";
};

// ─── Checkout Guard ───────────────────────────────────────────────────────────
export const assertCheckoutEnabled = async () => {
  const enabled = await db.isCheckoutEnabled();
  if (!enabled) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Checkout is currently disabled. Please check back soon.",
    });
  }
};

// ─── Stripe Singleton ─────────────────────────────────────────────────────────
let _stripe: import("stripe").default | null = null;
export const getStripe = async () => {
  if (_stripe) return _stripe;
  const Stripe = (await import("stripe")).default;
  _stripe = new Stripe(ENV.stripeSecretKey!, { apiVersion: "2025-01-27.acacia" });
  return _stripe;
};

// Re-export procedures and router builder for convenience
export { publicProcedure, protectedProcedure, sessionProcedure, router };
export { TRPCError };
export { db };
export { ENV };

