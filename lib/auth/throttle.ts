import crypto from "crypto";
import { connectToRedis } from "@/lib/redis";

/**
 * Layered brute-force protection for login and 2FA.
 *
 * Redis-backed with an in-process memory fallback so development setups
 * without Redis stay functional (the memory limiter is per-instance).
 */

const FAIL_WINDOW_S = 15 * 60; // 15 minutes
const MAX_EMAIL_FAILURES = 5;
const MAX_IP_FAILURES = 30;

export interface ThrottleStatus {
  blocked: boolean;
  remainingAttempts: number;
  retryAfterSeconds: number;
}

function shaKey(...parts: string[]): string {
  return crypto.createHash("sha256").update(parts.join("|")).digest("hex");
}

// ---------- In-memory fallback ----------
const memoryStore = new Map<string, { count: number; resetAt: number }>();

function memoryCleanup(): void {
  const now = Date.now();
  for (const [key, entry] of memoryStore) {
    if (entry.resetAt <= now) memoryStore.delete(key);
  }
}

function memoryRecord(key: string, limit: number): ThrottleStatus {
  memoryCleanup();
  const now = Date.now();
  const existing = memoryStore.get(key);
  const active = Boolean(existing && existing.resetAt > now);
  const count = active ? (existing?.count ?? 0) + 1 : 1;
  const resetAt = active && existing ? existing.resetAt : now + FAIL_WINDOW_S * 1000;
  memoryStore.set(key, { count, resetAt });
  const blocked = count > limit;
  return {
    blocked,
    remainingAttempts: Math.max(0, limit - count),
    retryAfterSeconds: Math.max(0, Math.ceil((resetAt - now) / 1000)),
  };
}

function memoryCheck(key: string, limit: number): ThrottleStatus {
  memoryCleanup();
  const existing = memoryStore.get(key);
  const now = Date.now();
  if (!existing || existing.resetAt <= now) {
    return { blocked: false, remainingAttempts: limit, retryAfterSeconds: 0 };
  }
  const blocked = existing.count > limit;
  return {
    blocked,
    remainingAttempts: Math.max(0, limit - existing.count),
    retryAfterSeconds: Math.max(0, Math.ceil((existing.resetAt - now) / 1000)),
  };
}
// ---------- Redis implementation ----------
async function redisInc(key: string, limit: number): Promise<ThrottleStatus> {
  const client = connectToRedis();
  const script = `
    local current = redis.call("INCR", KEYS[1])
    if current == 1 then
      redis.call("EXPIRE", KEYS[1], ARGV[1])
    end
    return {current, redis.call("TTL", KEYS[1])}
  `;
  const result = (await client.eval(script, 1, key, FAIL_WINDOW_S)) as [number, number];
  const count = Number(result[0]);
  const ttl = Number(result[1]);
  return {
    blocked: count > limit,
    remainingAttempts: Math.max(0, limit - count),
    retryAfterSeconds: ttl > 0 ? ttl : 0,
  };
}

async function redisCheck(key: string, limit: number): Promise<ThrottleStatus> {
  const client = connectToRedis();
  const [count, ttl] = (await Promise.all([client.get(key), client.ttl(key)])) as [
    string | null,
    number
  ];
  const current = count ? Number(count) : 0;
  return {
    blocked: current > limit,
    remainingAttempts: Math.max(0, limit - current),
    retryAfterSeconds: ttl > 0 ? ttl : 0,
  };
}

function redisAvailable(): boolean {
  return Boolean(process.env.REDIS_URL);
}

async function safeThrottle(op: "record" | "check", email: string, ip: string) {
  const emailKey = `auth_fail_login_email_${shaKey(email)}`;
  const ipKey = `auth_fail_login_ip_${shaKey(ip)}`;

  if (redisAvailable()) {
    try {
      const emailStatus =
        op === "record"
          ? await redisInc(emailKey, MAX_EMAIL_FAILURES)
          : await redisCheck(emailKey, MAX_EMAIL_FAILURES);
      const ipStatus =
        op === "record"
          ? await redisInc(ipKey, MAX_IP_FAILURES)
          : await redisCheck(ipKey, MAX_IP_FAILURES);
      return { emailStatus, ipStatus };
    } catch (error) {
      console.error("Login throttle unavailable:", error instanceof Error ? error.message : error);
      // Fall through to the in-memory limiter.
    }
  }

  const emailStatus =
    op === "record"
      ? memoryRecord(emailKey, MAX_EMAIL_FAILURES)
      : memoryCheck(emailKey, MAX_EMAIL_FAILURES);
  const ipStatus =
    op === "record" ? memoryRecord(ipKey, MAX_IP_FAILURES) : memoryCheck(ipKey, MAX_IP_FAILURES);
  return { emailStatus, ipStatus };
}

/** Record a failed login attempt for email+IP. */
export async function recordLoginFailure(email: string, ip: string): Promise<void> {
  await safeThrottle("record", email, ip);
}

/** Check whether login attempts for email+IP are currently throttled. */
export async function checkLoginThrottle(email: string, ip: string): Promise<ThrottleStatus> {
  const { emailStatus, ipStatus } = await safeThrottle("check", email, ip);
  const blocked = emailStatus.blocked || ipStatus.blocked;
  return {
    blocked,
    remainingAttempts: Math.min(emailStatus.remainingAttempts, ipStatus.remainingAttempts),
    retryAfterSeconds: Math.max(emailStatus.retryAfterSeconds, ipStatus.retryAfterSeconds),
  };
}

/** Clear failed-attempt counters after a successful login. */
export async function clearLoginFailures(email: string, ip: string): Promise<void> {
  const emailKey = `auth_fail_login_email_${shaKey(email)}`;
  const ipKey = `auth_fail_login_ip_${shaKey(ip)}`;
  try {
    if (redisAvailable()) {
      const client = connectToRedis();
      await Promise.all([client.del(emailKey), client.del(ipKey)]);
    }
  } catch {
    /* in-memory entries naturally expire */
  }
  memoryStore.delete(emailKey);
  memoryStore.delete(ipKey);
}

// ---------- Generic counter (used for 2FA attempts) ----------
/** Per-key counter used by 2FA attempt limiting (separate from login throttle). */
export async function incrementAndCheckAttempt(key: string, limit: number): Promise<ThrottleStatus> {
  const fullKey = `auth_fail_generic_${shaKey(key)}`;
  if (redisAvailable()) {
    try {
      return await redisInc(fullKey, limit);
    } catch (error) {
      console.error("2FA throttle unavailable:", error instanceof Error ? error.message : error);
    }
  }
  return memoryRecord(fullKey, limit);
}

export async function clearAttempts(key: string): Promise<void> {
  const fullKey = `auth_fail_generic_${shaKey(key)}`;
  try {
    if (redisAvailable()) {
      const client = connectToRedis();
      await client.del(fullKey);
    }
  } catch {
    /* noop */
  }
  memoryStore.delete(fullKey);
}
