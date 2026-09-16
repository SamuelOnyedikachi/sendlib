import { NextRequest, NextResponse } from "next/server";
import { requireAuthUser } from "@/lib/auth";
import { rateLimit } from "@/lib/rateLimit";
import { resendVerificationEmail } from "@/lib/auth/service";
import { getDeviceInfo, authErrorResponse } from "@/lib/auth/handlers";

export async function POST(req: NextRequest) {
  try {
    const authUser = await requireAuthUser(req);
    const device = getDeviceInfo(req);
    const rl = await rateLimit("auth", `resend-verification:${authUser.id}`);
    if (!rl.success) {
      return NextResponse.json(
        {
          success: false,
          code: "rate_limited",
          message: "You've requested a verification email too many times. Try again in a minute.",
        },
        { status: 429 }
      );
    }

    const result = await resendVerificationEmail({
      userId: authUser.id,
      email: authUser.email ?? "",
      displayName: authUser.displayName,
    });

    if (!result.emailSent) {
      return NextResponse.json({
        success: true,
        message: "Your email is already verified.",
      });
    }

    return NextResponse.json({
      success: true,
      message: "A new verification email has been sent.",
    });
  } catch (err) {
    return authErrorResponse(err);
  }
}