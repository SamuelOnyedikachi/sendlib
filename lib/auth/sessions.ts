import Session, { ISession } from "@/models/Session";
import { generateSecureToken, hashToken } from "./utils";

export const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
export const PENDING_SESSION_TTL_MS = 10 * 60 * 1000; // 10 minutes
export const MAX_TWO_FACTOR_ATTEMPTS = 5;

export interface CreateSessionInput {
  userId: string;
  userAgent?: string;
  ip?: string;
  status?: "active" | "pending";
  ttlMs?: number;
}

export async function createSession(
  input: CreateSessionInput
): Promise<{ token: string; session: ISession }> {
  const token = generateSecureToken(32, "base64url");
  const expiresAt = new Date(Date.now() + (input.ttlMs ?? SESSION_TTL_MS));
  const session = await Session.create({
    userId: input.userId,
    tokenHash: hashToken(token),
    userAgent: input.userAgent?.slice(0, 300),
    ip: input.ip,
    status: input.status ?? "active",
    expiresAt,
  });
  return { token, session };
}

/** Look up a live session by raw token (hashed before querying). */
export async function findSessionByToken(
  token: string | undefined | null
): Promise<ISession | null> {
  if (!token) return null;
  return Session.findOne({ tokenHash: hashToken(token) });
}

export async function revokeSession(token: string | undefined | null): Promise<void> {
  if (!token) return;
  await Session.updateOne({ tokenHash: hashToken(token) }, { revokedAt: new Date() }).exec();
}

/** Revoke all sessions for a user, optionally keeping one (e.g. the current one). */
export async function revokeAllSessionsForUser(
  userId: string,
  keepTokenHash?: string
): Promise<void> {
  const query: Record<string, unknown> = { userId, revokedAt: { $exists: false } };
  if (keepTokenHash) query.tokenHash = { $ne: keepTokenHash };
  await Session.updateMany(query, { revokedAt: new Date() }).exec();
}

/** Activate a pending 2FA session and extend its lifetime. */
export async function activateSession(session: ISession): Promise<void> {
  session.status = "active";
  session.failedTwoFactorAttempts = 0;
  session.expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  session.lastActiveAt = new Date();
  await session.save();
}

export async function incrementTwoFactorFailure(session: ISession): Promise<void> {
  session.failedTwoFactorAttempts += 1;
  await session.save();
}
