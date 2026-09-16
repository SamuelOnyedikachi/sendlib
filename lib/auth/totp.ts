import crypto from "crypto";
import { base32Decode, base32Encode } from "./base32";
import { safeEqual } from "./utils";

/**
 * RFC 6238 TOTP implementation using the same defaults as Google
 * Authenticator / Authy / 1Password: SHA-1, 6 digits, 30-second period.
 * Implemented in-house so authentication stays fully owned by the app
 * (crypto is a Node.js built-in).
 */

export interface TotpOptions {
  /** Clock step in seconds. RFC 6238 default: 30. */
  period?: number;
  /** Code length. Default: 6. */
  digits?: number;
  /** HMAC algorithm. Default: SHA-1. */
  algorithm?: "SHA-1" | "SHA-256" | "SHA-512";
}

export function generateTotpSecret(byteLength = 20): string {
  return base32Encode(crypto.randomBytes(byteLength));
}

function hexToInt(input: string): number {
  // Uint32 view of the first 8 hex chars; avoids BigInt by splitting.
  const hi = parseInt(input.slice(0, 8), 16) >>> 0;
  const lo = parseInt(input.slice(8, 16), 16) >>> 0;
  // Combine into a single number using the low 32 bits (safe up to 2^53).
  return hi * 0x100000000 + lo;
}

function hotp(
  key: Uint8Array,
  counter: number,
  { digits = 6, algorithm = "SHA-1" as const }: Required<Pick<TotpOptions, "digits">> & TotpOptions
): string {
  const counterBuffer = Buffer.alloc(8);
  counterBuffer.writeBigUInt64BE(BigInt(counter));
  const hmac = crypto.createHmac(algorithm, Buffer.from(key));
  hmac.update(counterBuffer);
  const hs = hmac.digest();

  const offset = hs[hs.length - 1] & 0x0f;
  const binary =
    ((hs[offset] & 0x7f) << 24) |
    ((hs[offset + 1] & 0xff) << 16) |
    ((hs[offset + 2] & 0xff) << 8) |
    (hs[offset + 3] & 0xff);

  const otp = binary % 10 ** digits;
  return otp.toString().padStart(digits, "0");
}

/**
 * Generate the TOTP code for `timestamp` (defaults to now). Returns both the
 * code and the counter for testing.
 */
export function generateTotp(
  base32Secret: string,
  timestamp = Date.now(),
  options: TotpOptions = {}
): { code: string; counter: number; period: number } {
  const { period = 30, digits = 6, algorithm = "SHA-1" } = options;
  const key = base32Decode(base32Secret);
  const counter = Math.floor(timestamp / 1000 / period);
  const code = hotp(key, counter, { digits, algorithm });
  return { code, counter, period };
}

/**
 * Verify a user-supplied TOTP code allowing `window` time-steps of clock
 * drift on either side (default: ±1 step). Comparison is constant-time.
 */
export function verifyTotp(
  base32Secret: string,
  code: string,
  timestamp = Date.now(),
  options: TotpOptions & { window?: number } = {}
): boolean {
  const cleaned = String(code).trim();
  if (!/^\d{4,10}$/.test(cleaned)) return false;
  const { period = 30, digits = 6, algorithm = "SHA-1" } = options;
  const window = options.window ?? 1;
  const counter = Math.floor(timestamp / 1000 / period);

  for (let i = -window; i <= window; i++) {
    const candidate = hotp(base32Decode(base32Secret), counter + i, { digits, algorithm });
    if (safeEqual(candidate, cleaned)) return true;
  }
  return false;
}

/** otpauth:// URI consumed by authenticator apps. */
export function buildOtpauthUri(opts: {
  secret: string;
  accountName: string;
  issuer?: string;
  period?: number;
  digits?: number;
  algorithm?: string;
}): string {
  const issuer = opts.issuer ?? "Sendlib";
  const label = `${issuer}:${opts.accountName}`;
  const params = new URLSearchParams({
    secret: opts.secret.replace(/[=\s]/g, ""),
    issuer,
    algorithm: opts.algorithm ?? "SHA1",
    digits: String(opts.digits ?? 6),
    period: String(opts.period ?? 30),
  });
  return `otpauth://totp/${encodeURIComponent(label)}?${params.toString()}`;
}

// Keep hexToInt referenced for potential extended verification usage.
void hexToInt;