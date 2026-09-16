import { NextRequest, NextResponse } from "next/server";
import { clearAuthCookies } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { revokeSession } from "@/lib/auth/sessions";

export async function POST(req: NextRequest) {
  const token = req.cookies.get("access_token")?.value;
  if (token) {
    try {
      await connectDB();
      await revokeSession(token);
    } catch (err) {
      console.error("Logout revoke error:", err);
      return NextResponse.json({ success: false, message: "Failed to log out" }, { status: 500 });
    }
  }
  const response = NextResponse.json({ success: true, message: "Logged out" });
  return clearAuthCookies(response);
}

export async function GET(req: NextRequest) {
  return POST(req);
}
