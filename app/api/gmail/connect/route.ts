import { requireAuthUser } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { getGmailAuthUrl } from "@/lib/gmail";
import { getEffectiveUserPlan } from "@/lib/paystack";
import GmailAccount from "@/models/GmailAccount";
import User from "@/models/User";
import { NextRequest, NextResponse } from "next/server";

const MAX_GMAIL_ACCOUNTS = 3;

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuthUser(req);
    await connectDB();

    const dbUser = await User.findById(user.id);
    if (!dbUser) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
    }

    const effectivePlan = getEffectiveUserPlan(dbUser);
    const count = await GmailAccount.countDocuments({ userId: user.id, connected: true });
    const maxAccounts = effectivePlan === "pro" ? 50 : MAX_GMAIL_ACCOUNTS;

    if (count >= maxAccounts) {
      return NextResponse.json(
        {
          success: false,
          message: `You have reached the maximum of ${maxAccounts} connected Gmail accounts.${effectivePlan === "free" ? " Upgrade to Pro to connect up to 50 accounts." : ""}`,
        },
        { status: 429 }
      );
    }

    const url = getGmailAuthUrl(user.id);
    return NextResponse.json({ success: true, url });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error("/api/gmail/connect error:", err);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
