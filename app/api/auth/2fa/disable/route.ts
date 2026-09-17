import { requireAuthUser } from "@/lib/auth";
import { authErrorResponse, getDeviceInfo, parseJsonBody } from "@/lib/auth/handlers";
import { disableTwoFactor } from "@/lib/auth/service";
import { rateLimit } from "@/lib/rateLimit";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const authUser = await requireAuthUser(req);
    const device = getDeviceInfo(req);
    const rl = await rateLimit("auth", `2fa-disable:${authUser.id}`);
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
    const user = await disableTwoFactor({
      userId: authUser.id,
      password: typeof body.password === "string" ? body.password : undefined,
      code: typeof body.code === "string" ? body.code : undefined,
      ...device,
    });

    return NextResponse.json({
      success: true,
      message: "Two-factor authentication has been disabled.",
      data: user,
    });
  } catch (err) {
    return authErrorResponse(err);
  }
}
