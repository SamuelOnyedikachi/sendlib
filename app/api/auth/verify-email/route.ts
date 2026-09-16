import { NextRequest, NextResponse } from "next/server";
import { verifyEmail } from "@/lib/auth/service";
import { authErrorResponse, parseJsonBody } from "@/lib/auth/handlers";

export async function POST(req: NextRequest) {
  try {
    const body = await parseJsonBody(req);
    const result = await verifyEmail({ token: String(body.token ?? "") });

    if (!result.ok) {
      const reasons = {
        invalid: "This verification link is invalid or has already been used.",
        expired: "This verification link has expired. Request a new one below.",
        used: "This verification link has already been used. Your email is already verified.",
      } as const;
      return NextResponse.json(
        { success: false, code: result.reason, message: reasons[result.reason] },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Your email address has been verified.",
    });
  } catch (err) {
    return authErrorResponse(err);
  }
}