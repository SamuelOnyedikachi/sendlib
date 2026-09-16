import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
import User from "@/models/User";
import { syncUserSubscription } from "@/lib/paystack";
import { isTwoFactorEnabled } from "@/lib/auth/twoFactor";

export async function GET(req: NextRequest) {
  try {
    const payload = await getAuthUser(req);
    if (!payload) {
      return NextResponse.json({ success: false, message: "Not authenticated" }, { status: 401 });
    }

    await connectDB();
    const userDoc = await User.findById(payload.id);
    if (!userDoc) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
    }

    const user = await syncUserSubscription(userDoc);

    return NextResponse.json({
      success: true,
      data: {
        id: user._id,
        email: user.email,
        displayName: user.displayName,
        avatar: user.avatar,
        emailVerified: user.emailVerified,
        hasPassword: Boolean(user.passwordHash),
        twoFactorEnabled: isTwoFactorEnabled(user),
        plan: user.plan,
        subscriptionStatus: user.subscriptionStatus,
        lastPaymentAt: user.lastPaymentAt,
        currentPeriodEnd: user.currentPeriodEnd,
        billingCurrency: user.billingCurrency,
        monthlySentCount: user.monthlySentCount,
        monthlyLimitResetAt: user.monthlyLimitResetAt,
        createdAt: user.createdAt,
      },
    });
  } catch (err) {
    console.error("/api/auth/me error:", err);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
