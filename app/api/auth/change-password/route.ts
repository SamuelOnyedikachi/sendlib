import { SESSION_COOKIE_NAME, requireAuthUser } from "@/lib/auth";
import { authErrorResponse, getDeviceInfo, parseJsonBody } from "@/lib/auth/handlers";
import { changePassword } from "@/lib/auth/service";
import { rateLimit } from "@/lib/rateLimit";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const authUser = await requireAuthUser(req);
    const device = getDeviceInfo(req);
    const rl = await rateLimit("auth", `change-password:${authUser.id}`);
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
    await changePassword({
      userId: authUser.id,
      currentPassword: String(body.currentPassword ?? ""),
      newPassword: String(body.newPassword ?? ""),
      code: body.code ? String(body.code) : undefined,
      keepSessionToken: req.cookies.get(SESSION_COOKIE_NAME)?.value,
      ...device,
    });

    return NextResponse.json({
      success: true,
      message: "Your password has been changed. You've been signed out of other devices.",
      requiresReLogin: true,
    });
  } catch (err) {
    return authErrorResponse(err);
  }
}
