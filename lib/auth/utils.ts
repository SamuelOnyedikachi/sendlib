import crypto from "crypto";

/**
 * Cryptographically secure random token. Link tokens (verification email,
 * password reset) use hex; session tokens use base64url.
 */
export function generateSecureToken(
  byteLength = 32,
  encoding: "hex" | "base64url" = "hex"
): string {
  return crypto.randomBytes(byteLength).toString(encoding);
}

/** SHA-256 digest used to store tokens at rest. */
export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

/** Normalize an email address: trim + lowercase. */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/** Minimal email shape check (full RFC validation is handled by zod). */
export function isEmailLike(value: string): boolean {
  return typeof value === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

/**
 * Constant-time string comparison that never throws on mismatched lengths.
 * Used for TOTP/recovery-code comparisons.
 */
export function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(String(a));
  const right = Buffer.from(String(b));
  if (left.length !== right.length) {
    // Burn comparable time so length differences don't leak timing.
    crypto.timingSafeEqual(left, left);
    return false;
  }
  return crypto.timingSafeEqual(left, right);
}

/** Derive a display name from an email local-part. */
export function displayNameFromEmail(email: string): string {
  const local = email.split("@")[0] ?? "user";
  const cleaned = local
    .replace(/[._-]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
  const fallback = email.split("@")[0] || "User";
  return (cleaned || fallback).slice(0, 35);
}
