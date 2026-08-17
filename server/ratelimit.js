// SPDX-License-Identifier: Apache-2.0
// Einfache Begrenzung pro Absender (Token-Bucket, im Speicher).
//
// Reicht für einen einzelnen Serverprozess. Bei mehreren Instanzen müsste das
// in eine gemeinsame Ablage wandern – dann ist aber ohnehin ein Reverse Proxy
// mit eigener Begrenzung im Spiel.

export function createRateLimiter({ capacity = 60, refillPerSecond = 1, now = () => Date.now() } = {}) {
  const buckets = new Map();

  const take = (key, cost = 1) => {
    const t = now();
    let bucket = buckets.get(key);
    if (!bucket) {
      bucket = { tokens: capacity, updated: t };
      buckets.set(key, bucket);
    }
    const elapsed = (t - bucket.updated) / 1000;
    bucket.tokens = Math.min(capacity, bucket.tokens + elapsed * refillPerSecond);
    bucket.updated = t;

    if (bucket.tokens < cost) {
      return { allowed: false, retryAfter: Math.ceil((cost - bucket.tokens) / refillPerSecond) };
    }
    bucket.tokens -= cost;
    return { allowed: true, retryAfter: 0 };
  };

  // Alte Einträge gelegentlich aufräumen, damit die Map nicht wächst.
  const sweep = () => {
    const t = now();
    for (const [key, bucket] of buckets) {
      if (t - bucket.updated > 3_600_000) buckets.delete(key);
    }
  };

  return { take, sweep, size: () => buckets.size };
}
