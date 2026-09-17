import argon2 from "argon2";
import { emailSchema, passwordSchema } from "./passwordPolicy";

/**
 * Argon2id with OWASP-recommended parameters (memory 19 MiB, iterations 2,
 * parallelism 1). Passwords are hashed server-side only.
 */
const HASH_OPTIONS: argon2.Options = {
  type: argon2.argon2id,
  memoryCost: 19456,
  timeCost: 2,
  parallelism: 1,
};

export async function hashPassword(password: string): Promise<string> {
  return argon2.hash(password, HASH_OPTIONS);
}

export async function verifyPassword(hash: string, password: string): Promise<boolean> {
  try {
    return await argon2.verify(hash, password);
  } catch {
    return false;
  }
}

/**
 * Pre-computed Argon2id hash of a random passphrase. Used only as a timing
 * equalizer when no account exists for an email, so login responses take a
 * similar amount of time whether or not an account exists.
 */
export const DUMMY_PASSWORD_HASH =
  "$argon2id$v=19$m=19456,t=2,p=1$FyQ5mB9Jq4SxC7GxHwE0Nw$u5zXw6CbV1Yq0L4mDtE7oKcF2aSbJ9gHnIeRw3pTvU8";

export function validatePassword(password: unknown): { ok: true } | { ok: false; error: string } {
  const parsed = passwordSchema.safeParse(password);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid password." };
  }
  return { ok: true };
}

export function validateEmail(
  email: unknown
): { ok: true; value: string } | { ok: false; error: string } {
  const parsed = emailSchema.safeParse(email);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid email address." };
  }
  return { ok: true, value: parsed.data };
}

export { passwordSchema, emailSchema };
