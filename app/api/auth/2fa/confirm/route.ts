import { requireAuthUser } from "@/lib/auth";
import { authErrorResponse, getDeviceInfo, parseJsonBody } from "@/lib/auth/handlers";
import { confirmTwoFactorSetup } from "@/lib/auth/service";
import { rateLimit } from "@/lib/rateLimit";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const authUser = await requireAuthUser(req);
    const device = getDeviceInfo(req);
    const rl = await rateLimit("auth", `2fa-confirm:${authUser.id}`);
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
    const user = await confirmTwoFactorSetup({
      userId: authUser.id,
      code: String(body.code ?? ""),
      ...device,
    });

    return NextResponse.json({
      success: true,
      message: "Two-factor authentication has been enabled.",
      data: user,
    });
  } catch (err) {
    return authErrorResponse(err);
  }
}
