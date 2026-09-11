import { NextRequest, NextResponse } from "next/server";
import { requireAuthUser } from "@/lib/auth";
import { initializePaystackTransaction } from "@/lib/paystack";

interface PaystackErrorResponse {
  response?: {
    data?: unknown;
    status?: number;
  };
  message?: string;
}

export async function POST(req: NextRequest) {
  try {
    const authUser = await requireAuthUser(req);
    if (!authUser.email) {
      return NextResponse.json(
        { success: false, message: "Your account does not have an email address associated with it." },
        { status: 400 }
      );
    }

    const requestHost = req.headers.get("host") || "localhost:3000";
    const protocol = req.headers.get("x-forwarded-proto") || (requestHost.includes("localhost") ? "http" : "https");
    const requestOrigin = `${protocol}://${requestHost}`;

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL;
    const origin = appUrl ? appUrl.replace(/\/$/, "") : requestOrigin;

    const planCode = process.env.PAYSTACK_PLAN_CODE?.trim();

    const session = await initializePaystackTransaction({
      email: authUser.email,
      plan: planCode || undefined,
      callbackUrl: `${origin}/dashboard/settings?billing=success`,
      metadata: {
        userId: authUser.id,
        plan: "pro",
      },
    });

    return NextResponse.json({
      success: true,
      url: session.authorization_url,
      reference: session.reference,
    });
  } catch (err: unknown) {
    if (err instanceof Response) return err;
    const errorObj = err as PaystackErrorResponse;
    const paystackErr = errorObj?.response?.data;
    const errorMessage = errorObj?.message || "Failed to initialize Paystack checkout session";
    const status = errorObj?.response?.status || 500;

    console.error("Paystack checkout error:", paystackErr || errorMessage);

    const errorDetail = typeof paystackErr === "object" ? JSON.stringify(paystackErr) : (paystackErr || errorMessage);
    return NextResponse.json(
      {
        success: false,
        message: `Paystack Checkout Error: ${errorDetail}`,
      },
      { status }
    );
  }
}
