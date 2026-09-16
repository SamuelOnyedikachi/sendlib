import { NextRequest, NextResponse } from "next/server";
import axios from "@/lib/axios";
import { connectDB } from "@/lib/db";
import { setAuthCookies, getClientIp } from "@/lib/auth";
import { createSession } from "@/lib/auth/sessions";
import { normalizeEmail } from "@/lib/auth/utils";
import User from "@/models/User";

const { NEXT_PUBLIC_APP_URL } = process.env;

interface GoogleUserInfo {
  id?: string;
  email?: string;
  name?: string;
  picture?: string;
  verified_email?: boolean;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const stateParam = searchParams.get("state");
  const oauthStateCookie = req.cookies.get("oauth_state")?.value;

  if (!code || !stateParam || stateParam !== oauthStateCookie) {
    return NextResponse.redirect(`${NEXT_PUBLIC_APP_URL}/login?error=invalid_state_or_code`);
  }

  try {
    const redirectUri = process.env.GOOGLE_CALLBACK_URL || `${NEXT_PUBLIC_APP_URL}/api/auth/google/callback`;
    
    // Use axios instead of googleapis to avoid Zeabur native fetch failures
    const tokenRes = await axios.post(
      "https://oauth2.googleapis.com/token",
      new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }).toString(),
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    );
    const tokens = tokenRes.data;

    const userInfoRes = await axios.get<GoogleUserInfo>("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    const { id, email, name, picture, verified_email } = userInfoRes.data;

    if (!id) {
      return NextResponse.redirect(`${NEXT_PUBLIC_APP_URL}/login?error=google_profile`);
    }

    await connectDB();

    const hasVerifiedEmail = Boolean(email && verified_email);
    const normalizedEmail = hasVerifiedEmail ? normalizeEmail(email) : undefined;

    let user = await User.findOne({ googleId: id });
    if (!user && normalizedEmail) {
      user = await User.findOne({ email: normalizedEmail });
      if (user) {
        user.googleId = id;
        user.avatar = picture ?? user.avatar;
        user.displayName = name ?? user.displayName;
        await user.save();
      }
    }

    if (!user) {
      user = await User.create({
        googleId: id,
        email: normalizedEmail ?? undefined,
        displayName: name ?? normalizedEmail ?? "User",
        avatar: picture ?? undefined,
        emailVerified: hasVerifiedEmail,
        emailVerifiedAt: hasVerifiedEmail ? new Date() : undefined,
      });
    } else {
      user.avatar = picture ?? user.avatar;
      user.displayName = name ?? user.displayName;
      if (normalizedEmail && !user.email) user.email = normalizedEmail;
      if (normalizedEmail) user.email = normalizedEmail;
      await user.save();
    }

    const { token } = await createSession({
      userId: user._id.toString(),
      userAgent: req.headers.get("user-agent") ?? undefined,
      ip: getClientIp(req),
      status: "active",
    });

    const response = NextResponse.redirect(`${NEXT_PUBLIC_APP_URL}/dashboard`);
    setAuthCookies(response, token);
    return response;
  } catch (err) {
    console.error("Google OAuth callback error:", err);
    return NextResponse.redirect(`${NEXT_PUBLIC_APP_URL}/login?error=google_callback`);
  }
}
