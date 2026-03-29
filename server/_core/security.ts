/**
 * security.ts
 * Production-ready security middleware:
 *  - Enhanced Content-Security-Policy
 *  - Global API rate limiting
 *  - Request logging / error tracking
 */

import type { Request, Response, NextFunction } from "express";
import { ENV } from "./env";

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

// ─── Global API Rate Limiter ──────────────────────────────────────────────────

type RateLimitEntry = { count: number; resetAt: number };
const globalRateLimitMap = new Map<string, RateLimitEntry>();

const GLOBAL_WINDOW_MS = 60_000; // 1 minute
const GLOBAL_MAX_REQUESTS = 200; // per IP per minute

function getIp(req: Request): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string") return forwarded.split(",")[0].trim();
  if (Array.isArray(forwarded) && forwarded.length > 0) return forwarded[0].trim();
  return req.ip || req.socket?.remoteAddress || "unknown";
}

// Periodic cleanup to prevent memory growth
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of globalRateLimitMap) {
    if (entry.resetAt <= now) globalRateLimitMap.delete(key);
  }
}, 5 * 60_000);

export function apiRateLimit(req: Request, res: Response, next: NextFunction) {
  // Only apply to /api routes
  if (!req.path.startsWith("/api/")) return next();

  // Stripe webhook is exempt
  if (req.path === "/api/stripe/webhook") return next();

  const ip = getIp(req);
  const now = Date.now();
  const entry = globalRateLimitMap.get(ip);

  if (!entry || entry.resetAt <= now) {
    globalRateLimitMap.set(ip, { count: 1, resetAt: now + GLOBAL_WINDOW_MS });
    return next();
  }

  entry.count += 1;

  if (entry.count > GLOBAL_MAX_REQUESTS) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
    res.setHeader("Retry-After", retryAfter.toString());
    res.setHeader("X-RateLimit-Limit", GLOBAL_MAX_REQUESTS.toString());
    res.setHeader("X-RateLimit-Remaining", "0");
    res.setHeader("X-RateLimit-Reset", Math.ceil(entry.resetAt / 1000).toString());
    return res.status(429).json({
      error: "Too many requests",
      retryAfter,
      message: `Rate limit exceeded. Try again in ${retryAfter}s.`,
    });
  }

  res.setHeader("X-RateLimit-Limit", GLOBAL_MAX_REQUESTS.toString());
  res.setHeader("X-RateLimit-Remaining", Math.max(0, GLOBAL_MAX_REQUESTS - entry.count).toString());
  res.setHeader("X-RateLimit-Reset", Math.ceil(entry.resetAt / 1000).toString());

  return next();
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
