import { NextRequest, NextResponse } from "next/server";
import { setAuthCookies } from "@/lib/auth";
import { rateLimit } from "@/lib/rateLimit";
import { signup } from "@/lib/auth/service";
import { getDeviceInfo, authErrorResponse, parseJsonBody } from "@/lib/auth/handlers";

export async function POST(req: NextRequest) {
  try {
    const rl = await rateLimit("signup", `${getDeviceInfo(req).ip ?? "unknown"}`);
    if (!rl.success) {
      return NextResponse.json(
        {
          success: false,
          code: "rate_limited",
          message: "Too many sign-up attempts. Please try again in a minute.",
        },
        { status: 429 }
      );
    }

    const body = await parseJsonBody(req);
    const device = getDeviceInfo(req);
    const result = await signup({
      email: String(body.email ?? ""),
      password: String(body.password ?? ""),
      ...device,
    });

    const response = NextResponse.json(
      {
        success: true,
        data: result.user,
        verificationPending: result.verificationPending,
        verificationEmailSent: result.verificationEmailSent,
      },
      { status: 201 }
    );
    setAuthCookies(response, result.sessionToken);
    return response;
  } catch (err) {
    return authErrorResponse(err);
  }
}