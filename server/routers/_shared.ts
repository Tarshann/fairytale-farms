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
