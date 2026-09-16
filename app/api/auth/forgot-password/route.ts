import { NextRequest, NextResponse } from "next/server";
import { rateLimit } from "@/lib/rateLimit";
import { requestPasswordReset } from "@/lib/auth/service";
import { getDeviceInfo, authErrorResponse, parseJsonBody } from "@/lib/auth/handlers";

const GENERIC_MESSAGE =
  "If an account exists for this email, you'll receive a password reset link.";

export async function POST(req: NextRequest) {
  try {
    const device = getDeviceInfo(req);
    const rl = await rateLimit("password_reset", `forgot:${device.ip ?? "unknown"}`);
    if (!rl.success) {
      return NextResponse.json(
        {
          success: true,
          message: GENERIC_MESSAGE,
        },
        { status: 200 }
      );
    }

    const body = await parseJsonBody(req);
    const result = await requestPasswordReset({
      email: String(body.email ?? ""),
      ...device,
    });

    // Respond generically whether or not an account exists / the email went out.
    return NextResponse.json({
      success: true,
      message: GENERIC_MESSAGE,
    });
  } catch (err) {
    return authErrorResponse(err);
  }
}