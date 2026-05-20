const store = new Map<string, { count: number; reset: number }>();

export function rateLimit(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || entry.reset < now) {
    store.set(key, { count: 1, reset: now + windowMs });
    return true;
  }

  if (entry.count >= max) return false;

  entry.count++;
  return true;
}

export function getRateLimitKey(type: "auth" | "api", identifier: string): string {
  return `${type}:${identifier}`;
}
