import { NextRequest, NextResponse } from "next/server";
import { clearAuthCookies } from "@/lib/auth";
import { revokeSession } from "@/lib/auth/sessions";

export async function POST(req: NextRequest) {
  const token = req.cookies.get("access_token")?.value;
  if (token) {
    try {
      await revokeSession(token);
    } catch (err) {
      console.error("Logout revoke error:", err);
    }
  }
  const response = NextResponse.json({ success: true, message: "Logged out" });
  return clearAuthCookies(response);
}

export async function GET(req: NextRequest) {
  return POST(req);
}
