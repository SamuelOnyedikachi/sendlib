import SecurityEvent, { SecurityEventType } from "@/models/SecurityEvent";

export async function recordSecurityEvent(input: {
  userId?: string;
  type: SecurityEventType;
  ip?: string;
  userAgent?: string;
  meta?: Record<string, unknown>;
}): Promise<void> {
  try {
    await SecurityEvent.create({
      userId: input.userId,
      type: input.type,
      ip: input.ip,
      userAgent: input.userAgent,
      meta: input.meta,
    });
  } catch (error) {
    // Security event logging must never break the auth flow itself.
    console.error("recordSecurityEvent failed", error instanceof Error ? error.message : error);
  }
}