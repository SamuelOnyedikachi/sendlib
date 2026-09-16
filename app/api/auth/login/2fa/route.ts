import { NextRequest, NextResponse } from "next/server";
import { setAuthCookies } from "@/lib/auth";
import { rateLimit } from "@/lib/rateLimit";
import { completeTwoFactorLogin } from "@/lib/auth/service";
import { getDeviceInfo, authErrorResponse, parseJsonBody } from "@/lib/auth/handlers";

export async function POST(req: NextRequest) {
  try {
    const body = await parseJsonBody(req);
    const device = getDeviceInfo(req);

    const pendingToken =
      req.cookies.get("access_token")?.value ?? String(body.sessionToken ?? "");

    const rl = await rateLimit("login", `2fa:${device.ip ?? "unknown"}`);
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

    const result = await completeTwoFactorLogin({
      sessionToken: pendingToken,
      code: String(body.code ?? ""),
      ...device,
    });

    const response = NextResponse.json({ success: true, data: result.user });
    setAuthCookies(response, result.sessionToken);
    return response;
  } catch (err) {
    return authErrorResponse(err);
  }
}