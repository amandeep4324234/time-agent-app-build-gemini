interface RateLimitRecord {
  count: number;
  resetAtMs: number;
}

const inMemoryRateLimits = new Map<string, RateLimitRecord>();

/**
 * Checks rate limit for a given key within a window.
 * Returns null if allowed, or { retryAfterSeconds } if exceeded.
 */
export function checkRateLimit(
  key: string,
  limit: number,
  windowSeconds: number
): { limited: boolean; retryAfterSeconds: number } {
  const now = Date.now();
  const existing = inMemoryRateLimits.get(key);

  if (!existing || now >= existing.resetAtMs) {
    inMemoryRateLimits.set(key, {
      count: 1,
      resetAtMs: now + windowSeconds * 1000,
    });
    return { limited: false, retryAfterSeconds: 0 };
  }

  if (existing.count >= limit) {
    const retryAfterSeconds = Math.max(1, Math.ceil((existing.resetAtMs - now) / 1000));
    return { limited: true, retryAfterSeconds };
  }

  existing.count += 1;
  return { limited: false, retryAfterSeconds: 0 };
}
