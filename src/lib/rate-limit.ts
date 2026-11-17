// This module is server-only. It reads Node built-ins and native addons that
// cannot be bundled for the browser. It is imported exclusively from server
// components and route handlers, never from a "use client" module.

/**
 * Minimal in-memory rate limiter.
 *
 * Purpose: blunt credential-stuffing on the login route and spam on the public
 * contact form. This is intentionally simple — a fixed window per key held in a
 * Map. It is per-process, so with multiple replicas the effective limit is
 * multiplied by the replica count; behind a real load balancer, move this to a
 * shared store (Redis) instead.
 */

interface Bucket {
  count: number;
  resetAt: number;
}

declare global {
  // eslint-disable-next-line no-var
  var __portfolioRateBuckets: Map<string, Bucket> | undefined;
}

function getBuckets(): Map<string, Bucket> {
  if (!globalThis.__portfolioRateBuckets) {
    globalThis.__portfolioRateBuckets = new Map();
  }
  return globalThis.__portfolioRateBuckets;
}

/** Removes expired buckets so the map cannot grow without bound. */
function pruneExpired(now: number): void {
  const buckets = getBuckets();
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  /** Seconds until the window resets. */
  retryAfter: number;
}

/**
 * Records an attempt and reports whether it is allowed.
 *
 * @param key          Identifier to rate limit on (e.g. `login:1.2.3.4`).
 * @param limit        Maximum attempts permitted per window.
 * @param windowMs     Window length in milliseconds.
 */
export function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): RateLimitResult {
  const now = Date.now();
  const buckets = getBuckets();

  // Amortised cleanup: prune on roughly every hundredth call.
  if (buckets.size > 50 && Math.random() < 0.01) pruneExpired(now);

  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, retryAfter: 0 };
  }

  existing.count += 1;

  if (existing.count > limit) {
    return {
      allowed: false,
      remaining: 0,
      retryAfter: Math.ceil((existing.resetAt - now) / 1000),
    };
  }

  return {
    allowed: true,
    remaining: limit - existing.count,
    retryAfter: 0,
  };
}

/**
 * Best-effort client IP.
 *
 * Behind the reverse proxy we ship in docker-compose, `x-forwarded-for` holds
 * the real client. It is client-controllable in general, which is acceptable
 * here: it only makes an attacker's own bucket more specific, and the login
 * route is additionally protected by the password itself.
 */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return request.headers.get("x-real-ip") ?? "unknown";
}
