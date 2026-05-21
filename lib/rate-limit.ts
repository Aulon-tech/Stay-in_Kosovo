const hits = new Map<string, { count: number; reset: number }>();

export function rateLimit(
  key: string,
  limit = 10,
  windowMs = 60_000
): { ok: boolean; retryAfter?: number } {
  const now = Date.now();
  const entry = hits.get(key);
  if (!entry || now > entry.reset) {
    hits.set(key, { count: 1, reset: now + windowMs });
    return { ok: true };
  }
  if (entry.count >= limit) {
    return { ok: false, retryAfter: Math.ceil((entry.reset - now) / 1000) };
  }
  entry.count += 1;
  return { ok: true };
}
