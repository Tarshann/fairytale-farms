/**
 * rateLimit.ts
 *
 * Provides a unified rate-limiting interface that automatically uses
 * Redis (via Upstash) when the UPSTASH_REDIS_REST_URL env var is set,
 * and falls back to a safe in-memory implementation for single-instance
 * development and staging environments.
 *
 * Usage:
 *   const { allowed, retryAfterMs } = await checkRateLimit(key, maxRequests, windowMs);
 *
 * Production setup:
 *   Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN in your Railway
 *   environment variables. Create a free Upstash Redis database at upstash.com.
 */

// ─── Types ────────────────────────────────────────────────────────────────────
export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterMs?: number;
}

// ─── In-Memory Fallback ───────────────────────────────────────────────────────
type MemEntry = { count: number; resetAt: number };
const memStore = new Map<string, MemEntry>();

// Periodic cleanup — prevents unbounded memory growth in long-running processes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of memStore) {
    if (entry.resetAt <= now) memStore.delete(key);
  }
}, 5 * 60_000);

async function checkMemoryRateLimit(
  key: string,
  max: number,
  windowMs: number
): Promise<RateLimitResult> {
  const now = Date.now();
  const entry = memStore.get(key);

  if (!entry || entry.resetAt <= now) {
    memStore.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: max - 1 };
  }

  entry.count += 1;
  const remaining = Math.max(0, max - entry.count);

  if (entry.count > max) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterMs: entry.resetAt - now,
    };
  }

  return { allowed: true, remaining };
}

// ─── Redis Backend (Upstash REST API) ─────────────────────────────────────────
// Uses the Upstash REST API directly (no persistent TCP connection needed)
// so it works in serverless and edge environments.
const UPSTASH_URL = (process.env.UPSTASH_REDIS_REST_URL ?? "").trim();
const UPSTASH_TOKEN = (process.env.UPSTASH_REDIS_REST_TOKEN ?? "").trim();
const redisAvailable = Boolean(UPSTASH_URL && UPSTASH_TOKEN);

if (redisAvailable) {
  console.log("[RateLimit] Using Upstash Redis for distributed rate limiting.");
} else {
  console.warn(
    "[RateLimit] UPSTASH_REDIS_REST_URL not set — using in-memory rate limiting. " +
    "This is NOT safe for multi-instance deployments. " +
    "Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN to enable Redis."
  );
}

async function upstashCommand(args: unknown[]): Promise<unknown> {
  const res = await fetch(`${UPSTASH_URL}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${UPSTASH_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(args),
  });
  if (!res.ok) {
    throw new Error(`Upstash error: ${res.status} ${res.statusText}`);
  }
  const json = (await res.json()) as { result: unknown };
  return json.result;
}

async function checkRedisRateLimit(
  key: string,
  max: number,
  windowMs: number
): Promise<RateLimitResult> {
  const windowSec = Math.ceil(windowMs / 1000);
  const redisKey = `rl:${key}`;

  try {
    // Atomic increment + set expiry if key is new
    const count = (await upstashCommand(["INCR", redisKey])) as number;
    if (count === 1) {
      await upstashCommand(["EXPIRE", redisKey, windowSec]);
    }

    const remaining = Math.max(0, max - count);

    if (count > max) {
      const ttl = (await upstashCommand(["PTTL", redisKey])) as number;
      return {
        allowed: false,
        remaining: 0,
        retryAfterMs: ttl > 0 ? ttl : windowMs,
      };
    }

    return { allowed: true, remaining };
  } catch (err) {
    // Redis failure → fail open (allow request) to avoid blocking legitimate traffic
    console.error("[RateLimit] Redis error, failing open:", err);
    return { allowed: true, remaining: max };
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────
/**
 * Check whether a given key is within its rate limit.
 *
 * @param key       Unique identifier (e.g. `ip:user@example.com`)
 * @param max       Maximum requests allowed in the window
 * @param windowMs  Window duration in milliseconds
 */
export async function checkRateLimit(
  key: string,
  max: number,
  windowMs: number
): Promise<RateLimitResult> {
  if (redisAvailable) {
    return checkRedisRateLimit(key, max, windowMs);
  }
  return checkMemoryRateLimit(key, max, windowMs);
}
