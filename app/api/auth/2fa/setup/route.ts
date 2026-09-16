import { NextRequest, NextResponse } from "next/server";
import { requireAuthUser } from "@/lib/auth";
import { beginTwoFactorSetup } from "@/lib/auth/service";
import { getDeviceInfo, authErrorResponse } from "@/lib/auth/handlers";

export async function POST(req: NextRequest) {
  try {
    const authUser = await requireAuthUser(req);
    const device = getDeviceInfo(req);
    const result = await beginTwoFactorSetup({
      userId: authUser.id,
      ...device,
    });

    return NextResponse.json({ success: true, data: result });
  } catch (err) {
    return authErrorResponse(err);
  }
}