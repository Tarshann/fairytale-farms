/**
 * security.ts
 * Production-ready security middleware:
 *  - Strict Content-Security-Policy (no unsafe-eval)
 *  - CORS with explicit origin allowlist
 *  - Global API rate limiting (Redis-backed when UPSTASH_REDIS_REST_URL is set)
 *  - Request logging / error tracking
 */

import type { Request, Response, NextFunction } from "express";
import { ENV } from "./env";
import { checkRateLimit } from "./rateLimit";

// ─── CORS Allowed Origins ─────────────────────────────────────────────────────
// Production origin(s) are derived from APP_ORIGIN / OAUTH_SERVER_URL.
// Localhost variants are always allowed in development.
const LOCALHOST_RE = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;

function getAllowedOrigins(): Set<string> {
  const origins = new Set<string>();
  if (ENV.appOrigin) origins.add(ENV.appOrigin);
  if (ENV.oAuthServerUrl) origins.add(ENV.oAuthServerUrl);
  return origins;
}

export function corsMiddleware(req: Request, res: Response, next: NextFunction) {
  const origin = req.headers.origin;
  if (!origin) return next(); // non-browser requests (server-to-server, curl) — allow

  const allowedOrigins = getAllowedOrigins();
  const isLocalhost = LOCALHOST_RE.test(origin);
  const isAllowed = allowedOrigins.has(origin) || (!ENV.isProduction && isLocalhost);

  if (isAllowed) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization, x-trpc-source"
    );
    res.setHeader("Vary", "Origin");
  }

  if (req.method === "OPTIONS") {
    // Preflight — respond immediately
    return res.status(204).end();
  }

  return next();
}

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
        // 'unsafe-inline' is required for Vite-bundled React apps (inline event handlers removed at build time).
        // 'unsafe-eval' has been REMOVED. If GTM requires it, load scripts via server-side tag manager.
        "script-src 'self' 'unsafe-inline' https://js.stripe.com https://www.googletagmanager.com",
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "font-src 'self' https://fonts.gstatic.com",
        "img-src 'self' data: blob: https:",
        "connect-src 'self' https://api.stripe.com https://*.stripe.com https://app.posthog.com https://us.i.posthog.com",
        "frame-src https://js.stripe.com https://hooks.stripe.com",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self' https://checkout.stripe.com",
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
