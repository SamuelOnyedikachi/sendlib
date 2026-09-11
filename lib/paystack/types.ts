export interface InitializeTransactionOptions {
  email: string;
  amount?: number; // In kobo (e.g. 400000 kobo for NGN 4,000)
  plan?: string; // Paystack Plan Code e.g. PLN_...
  callbackUrl?: string;
  metadata?: Record<string, unknown>;
}

export interface PaystackInitResponse {
  status: boolean;
  message: string;
  data: {
    authorization_url: string;
    access_code: string;
    reference: string;
  };
}

export interface PaystackVerifyResponse {
  status: boolean;
  message: string;
  data: {
    id: number;
    status: "success" | "failed" | "abandoned" | string;
    reference: string;
    amount: number;
    currency: string;
    paid_at: string;
    customer: {
      id: number;
      email: string;
      customer_code: string;
    };
    plan?: string | null;
    plan_object?: {
      id: number;
      name: string;
      plan_code: string;
      amount: number;
      interval: string;
    };
    authorization?: {
      authorization_code: string;
      card_type: string;
      last4: string;
      exp_month: string;
      exp_year: string;
      bin: string;
      bank: string;
      channel: string;
      signature: string;
      reusable: boolean;
      country_code: string;
    };
    metadata?: Record<string, unknown>;
  };
}
