/**
 * Minimal, strict RFC 4648 base32 implementation (no padding) used for TOTP
 * secrets, compatible with Google Authenticator / Authy / 1Password.
 */

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
const CHAR_MAP: Record<string, number> = {};
for (let i = 0; i < ALPHABET.length; i++) {
  CHAR_MAP[ALPHABET[i]] = i;
}

export function base32Encode(bytes: Uint8Array): string {
  let bits = 0;
  let value = 0;
  let output = "";
  for (const byte of bytes) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      output += ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) {
    output += ALPHABET[(value << (5 - bits)) & 31];
  }
  return output;
}

export function base32Decode(input: string): Uint8Array {
  const cleaned = input.toUpperCase().replace(/[=\s]/g, "");
  if (cleaned.length === 0) return new Uint8Array(0);
  if (/[^A-Z2-7]/.test(cleaned)) {
    throw new Error("Invalid base32 string.");
  }

  let bits = 0;
  let value = 0;
  const bytes: number[] = [];
  for (const char of cleaned) {
    value = (value << 5) | CHAR_MAP[char];
    bits += 5;
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  return Uint8Array.from(bytes);
}

/** Base32-encode a raw secret so it can be displayed to the user. */
export function normalizeBase32Secret(secret: string): string {
  return secret.toUpperCase().replace(/[=\s]/g, "");
}