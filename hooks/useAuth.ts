import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";

export interface User {
  id: string;
  displayName: string;
  avatar?: string;
  email?: string;
  emailVerified?: boolean;
  twoFactorEnabled?: boolean;
  hasPassword?: boolean;
  plan?: "free" | "pro";
  subscriptionStatus?: "active" | "canceled" | "past_due" | "none";
  lastPaymentAt?: string;
  currentPeriodEnd?: string;
  billingCurrency?: string;
  monthlySentCount?: number;
  monthlyLimitResetAt?: string;
  createdAt: string;
}

export function useMe() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

  const hasToken = typeof window !== "undefined" && document.cookie.includes("logged_in=true");

  const query = useQuery({
    queryKey: ["me"],
    queryFn: async () => {
      const res = await api.get<never, { success: boolean; data: User }>("/auth/me");
      return res.data;
    },
    enabled: hasToken && mounted,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  const isLoading = !mounted || (hasToken && query.isLoading);

  return {
    ...query,
    isLoading,
    hasToken,
    isUnauthenticated: mounted && !hasToken,
  };
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { displayName?: string }) => {
      const res = await api.patch<never, { success: boolean; data: User }>("/user", data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["me"] });
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      await api.post("/auth/logout");
    },
    onSuccess: () => {
      queryClient.clear();
      window.location.href = "/login";
    },
  });
}

// ---------------------------------------------------------------------------
// Authentication hooks (email/password + 2FA)
// ---------------------------------------------------------------------------

export interface AuthResponse {
  success: boolean;
  requiresTwoFactor?: boolean;
  data?: User;
  message?: string;
  verificationPending?: boolean;
  verificationEmailSent?: boolean;
  code?: string;
}

export function useSignup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { email: string; password: string }) => {
      const res = await api.post<never, AuthResponse>("/auth/signup", input);
      return res;
    },
    onSuccess: (res) => {
      if (res.data && typeof res.data === "object" && "id" in res.data) {
        queryClient.setQueryData(["me"], res.data);
      }
    },
  });
}

export function useLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      email: string;
      password: string;
    }): Promise<AuthResponse> => {
      const res = await api.post<never, AuthResponse>("/auth/login", input);
      return res;
    },
    onSuccess: (res) => {
      if (res.data && "id" in (res.data as object)) {
        queryClient.setQueryData(["me"], res.data);
      }
    },
  });
}

export function useCompleteTwoFactorLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { code: string; sessionToken?: string }): Promise<AuthResponse> => {
      const res = await api.post<never, AuthResponse>("/auth/login/2fa", input);
      return res;
    },
    onSuccess: (res) => {
      if (res.data && "id" in (res.data as object)) {
        queryClient.setQueryData(["me"], res.data);
      }
    },
  });
}

export function useForgotPassword() {
  return useMutation({
    mutationFn: async (input: { email: string }) => {
      const res = await api.post<never, { success: boolean; message: string }>(
        "/auth/forgot-password",
        input
      );
      return res;
    },
  });
}

export function useResetPassword() {
  return useMutation({
    mutationFn: async (input: { token: string; newPassword: string }) => {
      const res = await api.post<never, { success: boolean; message: string }>(
        "/auth/reset-password",
        input
      );
      return res;
    },
  });
}

export function useVerifyEmail() {
  return useMutation({
    mutationFn: async (input: { token: string }) => {
      const res = await api.post<never, { success: boolean; message: string }>(
        "/auth/verify-email",
        input
      );
      return res;
    },
  });
}

export function useResendVerification() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await api.post<never, { success: boolean; message: string }>(
        "/auth/resend-verification"
      );
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["me"] });
    },
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: async (input: { currentPassword: string; newPassword: string }) => {
      const res = await api.post<never, { success: boolean; message: string }>(
        "/auth/change-password",
        input
      );
      return res;
    },
  });
}

// ---------------------------------------------------------------------------
// 2FA management hooks
// ---------------------------------------------------------------------------

export interface TwoFactorSetupData {
  secret: string;
  otpauthUri: string;
  recoveryCodes: string[];
  expiresAt: string;
}

export function useBeginTwoFactorSetup() {
  return useMutation({
    mutationFn: async (): Promise<{ success: boolean; data: TwoFactorSetupData }> => {
      const res = await api.post<never, { success: boolean; data: TwoFactorSetupData }>(
        "/auth/2fa/setup"
      );
      return res;
    },
  });
}

export function useConfirmTwoFactorSetup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { code: string }): Promise<{ success: boolean; message: string; data?: User }> => {
      const res = await api.post<never, { success: boolean; message: string; data?: User }>(
        "/auth/2fa/confirm",
        input
      );
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["me"] });
    },
  });
}

export function useDisableTwoFactor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { password?: string; code?: string }): Promise<{ success: boolean; message: string }> => {
      const res = await api.post<never, { success: boolean; message: string }>(
        "/auth/2fa/disable",
        input
      );
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["me"] });
    },
  });
}
