import { IUser } from "@/models/User";

/**
 * Synchronize and validate user subscription status.
 * Downgrades expired accounts if past their billing period + grace period.
 */
export async function syncUserSubscription(user: IUser): Promise<IUser> {
  if (user.plan !== "pro") {
    return user;
  }

  const now = Date.now();
  let isExpired = false;

  if (user.currentPeriodEnd) {
    isExpired = now > new Date(user.currentPeriodEnd).getTime() + 24 * 60 * 60 * 1000;
  } else if (user.lastPaymentAt) {
    isExpired = now > new Date(user.lastPaymentAt).getTime() + 32 * 24 * 60 * 60 * 1000;
  }

  if (isExpired) {
    user.plan = "free";
    user.subscriptionStatus = user.subscriptionStatus === "canceled" ? "canceled" : "past_due";
    await user.save();
  }

  return user;
}

/**
 * Returns effective plan ("free" | "pro") taking expiration into account immediately,
 * even for lean / cached queries.
 */
export function getEffectiveUserPlan(
  user?: {
    plan?: string;
    currentPeriodEnd?: Date;
    lastPaymentAt?: Date;
    subscriptionStatus?: string;
  } | null
): "free" | "pro" {
  if (!user || user.plan !== "pro") return "free";

  const now = Date.now();
  if (user.currentPeriodEnd) {
    if (now > new Date(user.currentPeriodEnd).getTime() + 24 * 60 * 60 * 1000) {
      return "free";
    }
  } else if (user.lastPaymentAt) {
    if (now > new Date(user.lastPaymentAt).getTime() + 32 * 24 * 60 * 60 * 1000) {
      return "free";
    }
  }

  return "pro";
}
