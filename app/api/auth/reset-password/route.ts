import { authErrorResponse, getDeviceInfo, parseJsonBody } from "@/lib/auth/handlers";
import { resetPassword } from "@/lib/auth/service";
import { rateLimit } from "@/lib/rateLimit";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const device = getDeviceInfo(req);
    const rl = await rateLimit("password_reset", `reset:${device.ip ?? "unknown"}`);
    if (!rl.success) {
      return NextResponse.json(
        {
          success: false,
          code: "rate_limited",
          message: "Too many attempts. Please try again in a minute.",
        },
        { status: 429 }
      );
    }

    const body = await parseJsonBody(req);
    await resetPassword({
      token: String(body.token ?? ""),
      newPassword: String(body.newPassword ?? ""),
      ...device,
    });

    return NextResponse.json({
      success: true,
      message: "Your password has been reset. You can now log in with your new password.",
    });
  } catch (err) {
    return authErrorResponse(err);
  }
}
