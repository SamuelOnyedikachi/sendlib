import User from "@/models/User";
import VerificationToken, { VerificationTokenKind } from "@/models/VerificationToken";
import { generateSecureToken, hashToken, normalizeEmail } from "./utils";

export const TOKEN_TTL_MS: Record<VerificationTokenKind, number> = {
  email_verification: 24 * 60 * 60 * 1000, // 24 hours
  password_reset: 30 * 60 * 1000, // 30 minutes
};

export interface CreateTokenInput {
  userId: string;
  kind: VerificationTokenKind;
  /** Override TTL (tests / special cases). */
  ttlMs?: number;
}

/**
 * Create a single-use verification/reset token and return the raw token.
 * Existing unused tokens of the same kind for this user are invalidated so
 * only the most recent token remains valid (prevents token replay storms and
 * resend-abuse confusion).
 */
export async function createVerificationToken(input: CreateTokenInput): Promise<string> {
  const rawToken = generateSecureToken(32, "hex");
  const ttl = input.ttlMs ?? TOKEN_TTL_MS[input.kind];

  await VerificationToken.updateMany(
    {
      userId: input.userId,
      kind: input.kind,
      usedAt: { $exists: false },
      expiresAt: { $gt: new Date() },
    },
    { usedAt: new Date() }
  ).exec();

  await VerificationToken.create({
    userId: input.userId,
    kind: input.kind,
    tokenHash: hashToken(rawToken),
    expiresAt: new Date(Date.now() + ttl),
  });

  return rawToken;
}

export type ConsumeResult =
  | { ok: true; userId: string }
  | { ok: false; reason: "invalid" | "expired" | "used" };

/**
 * Consume (single-use) a verification/reset token. Only a live, unused,
 * unexpired token succeeds; any other state is reported precisely so the
 * UI can explain what happened.
 */
export async function consumeVerificationToken(
  token: string,
  kind: VerificationTokenKind
): Promise<ConsumeResult> {
  if (!token || typeof token !== "string") return { ok: false, reason: "invalid" };
  const tokenDoc = await VerificationToken.findOne({
    tokenHash: hashToken(token),
    kind,
  });

  if (!tokenDoc) {
    // A token may already be consumed/deleted; treat as invalid.
    return { ok: false, reason: "invalid" };
  }
  if (tokenDoc.usedAt) return { ok: false, reason: "used" };
  if (tokenDoc.expiresAt.getTime() <= Date.now()) return { ok: false, reason: "expired" };

  // Enforce single use atomically.
  const consumed = await VerificationToken.findOneAndUpdate(
    { _id: tokenDoc._id, usedAt: { $exists: false } },
    { usedAt: new Date() },
    { new: true }
  );
  if (!consumed) return { ok: false, reason: "used" };

  const user = await User.findById(tokenDoc.userId);
  if (!user) return { ok: false, reason: "invalid" };

  return { ok: true, userId: user._id.toString() };
}

/** Mark all unused tokens of a kind for a user as used (post-verification clean-up). */
export async function consumeVerificationTokenAllForKind(
  userId: string,
  kind: VerificationTokenKind
): Promise<void> {
  await VerificationToken.updateMany(
    { userId, kind, usedAt: { $exists: false } },
    { usedAt: new Date() }
  ).exec();
}

/** Look up the user an email belongs to (used by forgot-password). */
export async function findUserByEmail(email: string) {
  return User.findOne({ email: normalizeEmail(email) });
}
