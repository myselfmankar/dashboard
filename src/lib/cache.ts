/**
 * Lightweight TTL cache for frontend data (backend rows + AI insights).
 *
 * Why: reduces Firestore reads, avoids spinners on revisit, and lets us stash
 * expensive AI-generated summaries so the client sees "instant" data.
 *
 * Storage: localStorage (string-keyed). Swap the backing store here if we outgrow
 * ~5MB — everything else talks to this module, not storage directly.
 *
 * Keying convention: `${namespace}:${id}`. Prefer namespaces like
 *   'institute:inst_001:classes'
 *   'class:class_10A:insights'
 *   'ai:notebook:nb_physics_001:summary'
 */

// Bump the version suffix whenever the shape of cached values changes so that
// stale entries from previous deploys are ignored (they just won't match the
// new prefix and expire naturally).
const PREFIX = 'notivo.cache.v2:';

type Entry<T> = {
  v: T;
  /** expiry epoch ms; 0 = no expiry */
  e: number;
};

function fullKey(key: string): string {
  return PREFIX + key;
}

function safeParse<T>(raw: string | null): Entry<T> | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Entry<T>;
  } catch {
    return null;
  }
}

export const cache = {
  get<T>(key: string): T | null {
    const entry = safeParse<T>(localStorage.getItem(fullKey(key)));
    if (!entry) return null;
    if (entry.e !== 0 && Date.now() > entry.e) {
      localStorage.removeItem(fullKey(key));
      return null;
    }
    return entry.v;
  },

  set<T>(key: string, value: T, ttlMs = 5 * 60 * 1000): void {
    const entry: Entry<T> = { v: value, e: ttlMs > 0 ? Date.now() + ttlMs : 0 };
    try {
      localStorage.setItem(fullKey(key), JSON.stringify(entry));
    } catch (err) {
      // Quota exceeded or serialization failure — drop silently; cache is best-effort.
      console.warn('cache.set failed for', key, err);
    }
  },

  /** Read-through: returns cached value if fresh, otherwise runs fetcher and stores the result. */
  async getOrFetch<T>(key: string, ttlMs: number, fetcher: () => Promise<T>): Promise<T> {
    const hit = cache.get<T>(key);
    if (hit !== null) return hit;
    const value = await fetcher();
    cache.set(key, value, ttlMs);
    return value;
  },

  invalidate(key: string): void {
    localStorage.removeItem(fullKey(key));
  },

  /** Remove every entry whose key starts with the given prefix (not including the internal PREFIX). */
  invalidatePrefix(prefix: string): void {
    const target = fullKey(prefix);
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const k = localStorage.key(i);
      if (k && k.startsWith(target)) localStorage.removeItem(k);
    }
  },

  clearAll(): void {
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const k = localStorage.key(i);
      if (k && k.startsWith(PREFIX)) localStorage.removeItem(k);
    }
  },
};

/** Standard TTLs. Tune as we learn real read patterns. */
export const TTL = {
  short: 60 * 1000, // 1 min — volatile lists (live sessions)
  medium: 5 * 60 * 1000, // 5 min — rosters, class lists
  long: 30 * 60 * 1000, // 30 min — AI insights, summaries
  day: 24 * 60 * 60 * 1000, // 24 hr — institute metadata
};
