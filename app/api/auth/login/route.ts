import { setAuthCookies, setPendingAuthCookies } from "@/lib/auth";
import { authErrorResponse, getDeviceInfo, parseJsonBody } from "@/lib/auth/handlers";
import { login } from "@/lib/auth/service";
import { rateLimit } from "@/lib/rateLimit";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const rl = await rateLimit("login", `${getDeviceInfo(req).ip ?? "unknown"}`);
    if (!rl.success) {
      return NextResponse.json(
        {
          success: false,
          code: "rate_limited",
          message: "Too many login attempts. Please try again in a minute.",
        },
        { status: 429 }
      );
    }

    const body = await parseJsonBody(req);
    const device = getDeviceInfo(req);
    const result = await login({
      email: String(body.email ?? ""),
      password: String(body.password ?? ""),
      ...device,
    });

    if (result.needsTwoFactor) {
      // Pending session only: the user must complete 2FA before a full session.
      const response = NextResponse.json({
        success: true,
        requiresTwoFactor: true,
        data: null,
      });
      setPendingAuthCookies(response, result.sessionToken!);
      return response;
    }

    const response = NextResponse.json({
      success: true,
      requiresTwoFactor: false,
      data: result.user,
    });
    setAuthCookies(response, result.sessionToken!);
    return response;
  } catch (err) {
    return authErrorResponse(err);
  }
}
