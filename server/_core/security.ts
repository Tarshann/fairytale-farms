/**
 * security.ts
 * Production-ready security middleware:
 *  - Enhanced Content-Security-Policy
 *  - Global API rate limiting (Redis-backed when UPSTASH_REDIS_REST_URL is set)
 *  - Request logging / error tracking
 */

import type { Request, Response, NextFunction } from "express";
import { ENV } from "./env";
import { checkRateLimit } from "./rateLimit";

// ─── Security Headers ─────────────────────────────────────────────────────────

export function securityHeaders(_req: Request, res: Response, next: NextFunction) {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), payment=(self)"
  );

  if (ENV.isProduction) {
    res.setHeader(
      "Strict-Transport-Security",
      "max-age=63072000; includeSubDomains; preload"
    );
    res.setHeader(
      "Content-Security-Policy",
      [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://www.googletagmanager.com",
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "font-src 'self' https://fonts.gstatic.com",
        "img-src 'self' data: blob: https:",
        "connect-src 'self' https://api.stripe.com https://*.stripe.com https://app.posthog.com",
        "frame-src https://js.stripe.com https://hooks.stripe.com",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
        "upgrade-insecure-requests",
      ].join("; ")
    );
  }

  next();
}

// ─── IP Helper ────────────────────────────────────────────────────────────────

function getIp(req: Request): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string") return forwarded.split(",")[0].trim();
  if (Array.isArray(forwarded) && forwarded.length > 0) return forwarded[0].trim();
  return req.ip || req.socket?.remoteAddress || "unknown";
}

// ─── Global API Rate Limiter ──────────────────────────────────────────────────
// Delegates to Redis (Upstash) when available, in-memory otherwise.
// See server/_core/rateLimit.ts for implementation details.

const GLOBAL_WINDOW_MS = 60_000;   // 1 minute
const GLOBAL_MAX_REQUESTS = 200;   // per IP per minute

export function apiRateLimit(req: Request, res: Response, next: NextFunction) {
  // Only apply to /api routes
  if (!req.path.startsWith("/api/")) return next();

  // Stripe webhook is exempt (has its own signature verification)
  if (req.path === "/api/stripe/webhook") return next();

  const ip = getIp(req);

  checkRateLimit(`global:${ip}`, GLOBAL_MAX_REQUESTS, GLOBAL_WINDOW_MS)
    .then(result => {
      res.setHeader("X-RateLimit-Limit", GLOBAL_MAX_REQUESTS.toString());
      res.setHeader("X-RateLimit-Remaining", result.remaining.toString());

      if (!result.allowed) {
        const retryAfter = result.retryAfterMs
          ? Math.ceil(result.retryAfterMs / 1000)
          : 60;
        res.setHeader("Retry-After", retryAfter.toString());
        res.setHeader("X-RateLimit-Remaining", "0");
        return res.status(429).json({
          error: "Too many requests",
          retryAfter,
          message: `Rate limit exceeded. Try again in ${retryAfter}s.`,
        });
      }

      return next();
    })
    .catch(err => {
      // Rate limit check failure → fail open to avoid blocking legitimate traffic
      console.error("[Security] Rate limit check failed, failing open:", err);
      return next();
    });
}

// ─── Request Logger ───────────────────────────────────────────────────────────

export function requestLogger(req: Request, res: Response, next: NextFunction) {
  if (!ENV.isProduction) return next();

  const start = Date.now();
  const ip = getIp(req);

  res.on("finish", () => {
    const ms = Date.now() - start;
    const level = res.statusCode >= 500 ? "ERROR" : res.statusCode >= 400 ? "WARN" : "INFO";
    if (res.statusCode >= 400 || ms > 3000) {
      console.log(
        `[${level}] ${req.method} ${req.path} ${res.statusCode} ${ms}ms ip=${ip}`
      );
    }
  });

  next();
}

// ─── Global Error Handler ─────────────────────────────────────────────────────

export function globalErrorHandler(
  err: Error,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
) {
  const ip = getIp(req);
  console.error(
    `[ERROR] Unhandled exception: ${err.message}\nPath: ${req.method} ${req.path}\nIP: ${ip}\nStack: ${err.stack}`
  );

  if (res.headersSent) return;

  res.status(500).json({
    error: "Internal server error",
    message: ENV.isProduction ? "Something went wrong." : err.message,
  });
}
