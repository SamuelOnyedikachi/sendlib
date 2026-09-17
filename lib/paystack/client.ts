import crypto from "crypto";
import axios from "@/lib/axios";
import {
  InitializeTransactionOptions,
  PaystackInitResponse,
  PaystackVerifyResponse,
} from "./types";

const PAYSTACK_BASE_URL = "https://api.paystack.co";

function getSecretKey(): string {
  const secretKey = (process.env.PAYSTACK_SECRET_KEY || "").trim();
  if (!secretKey) {
    throw new Error("PAYSTACK_SECRET_KEY is missing from environment variables.");
  }
  return secretKey;
}

export async function initializePaystackTransaction(
  options: InitializeTransactionOptions
): Promise<PaystackInitResponse["data"]> {
  const secretKey = getSecretKey();
  const payload: Record<string, unknown> = {
    email: options.email,
    callback_url: options.callbackUrl,
    metadata: options.metadata,
  };

  if (options.plan) {
    payload.plan = options.plan;
  }
  if (options.amount !== undefined) {
    payload.amount = options.amount;
  }

  const response = await axios.post<PaystackInitResponse>(
    `${PAYSTACK_BASE_URL}/transaction/initialize`,
    payload,
    {
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.data?.status || !response.data?.data) {
    throw new Error(response.data?.message || "Failed to initialize Paystack transaction");
  }

  return response.data.data;
}

export async function verifyPaystackTransaction(
  reference: string
): Promise<PaystackVerifyResponse["data"]> {
  const secretKey = getSecretKey();
  const response = await axios.get<PaystackVerifyResponse>(
    `${PAYSTACK_BASE_URL}/transaction/verify/${encodeURIComponent(reference)}`,
    {
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.data?.status || !response.data?.data) {
    throw new Error(response.data?.message || "Failed to verify Paystack transaction");
  }

  return response.data.data;
}

export async function disablePaystackSubscription(options: {
  code: string;
  token: string;
}): Promise<boolean> {
  const secretKey = getSecretKey();
  const response = await axios.post(
    `${PAYSTACK_BASE_URL}/subscription/disable`,
    {
      code: options.code,
      token: options.token,
    },
    {
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/json",
      },
    }
  );

  return Boolean(response.data?.status);
}

export function verifyPaystackSignature(
  rawBody: string,
  signatureHeader: string,
  secretKey?: string
): boolean {
  try {
    const secret = (secretKey || process.env.PAYSTACK_SECRET_KEY || "").trim();
    if (!secret || !signatureHeader) return false;

    const hash = crypto.createHmac("sha512", secret).update(rawBody, "utf8").digest("hex");

    if (hash.length !== signatureHeader.trim().length) return false;

    return crypto.timingSafeEqual(
      Buffer.from(hash, "hex"),
      Buffer.from(signatureHeader.trim(), "hex")
    );
  } catch (err) {
    console.error("Paystack signature verification error:", err);
    return false;
  }
}
