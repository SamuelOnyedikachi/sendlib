"use client";

import { useState, Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import AuthShell from "@/components/auth/AuthShell";
import { FormField } from "@/components/auth/FormField";
import { useResetPassword } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { passwordSchema } from "@/lib/auth/passwordPolicy";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [invalidLink, setInvalidLink] = useState(!token);

  const reset = useResetPassword();

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setPasswordError(null);
    setConfirmError(null);

    if (!token) {
      setInvalidLink(true);
      return;
    }

    const parsed = passwordSchema.safeParse(password);
    if (!parsed.success) {
      setPasswordError(parsed.error.issues[0]?.message ?? "Invalid password.");
      return;
    }
    if (password !== confirm) {
      setConfirmError("Passwords do not match.");
      return;
    }

    reset.mutate(
      { token, newPassword: password },
      {
        onSuccess: (res) => {
          toast.success(res.message ?? "Your password has been reset.");
          router.push("/login");
        },
        onError: (err: unknown) => {
          setPasswordError(err instanceof Error ? err.message : "Link is invalid or expired.");
        },
      }
    );
  };

  return (
    <AuthShell
      title="Choose a new password"
      subtitle="Create a new password for your Sendlib account."
    >
      {invalidLink ? (
        <div className="space-y-md text-center py-6">
          <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
            This password reset link is missing. Request a new link to continue.
          </p>
          <button
            type="button"
            onClick={() => router.push("/forgot-password")}
            className="w-full h-12 rounded-xl font-label-sm text-label-sm bg-primary-sendlib text-black hover:opacity-90"
          >
            Request a new link
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-md" noValidate>
          <FormField label="New password" htmlFor="reset-password" error={passwordError ?? undefined}>
            <Input
              id="reset-password"
              type="password"
              autoComplete="new-password"
              required
              className="h-12 rounded-xl bg-surface px-4"
              placeholder="Enter a new password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setPasswordError(null);
              }}
            />
          </FormField>

          <FormField label="Confirm password" htmlFor="reset-confirm" error={confirmError ?? undefined}>
            <Input
              id="reset-confirm"
              type="password"
              autoComplete="new-password"
              required
              className="h-12 rounded-xl bg-surface px-4"
              placeholder="Repeat the new password"
              value={confirm}
              onChange={(e) => {
                setConfirm(e.target.value);
                setConfirmError(null);
              }}
            />
          </FormField>

          <div
            className="rounded-lg border border-outline-variant bg-surface-container-low px-3 py-2"
            role="status"
          >
            <span className="text-xs text-secondary">
              {reset.isPending
                ? "Updating your password..."
                : "Password needs at least 8 characters, a letter, and a number."}
            </span>
          </div>

          <Button
            type="submit"
            disabled={reset.isPending || !password || !confirm}
            className="w-full h-12 rounded-xl font-label-sm text-label-sm bg-primary-sendlib text-black hover:opacity-90"
          >
            {reset.isPending ? "Resetting password..." : "Set new password"}
          </Button>
        </form>
      )}
    </AuthShell>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background-sendlib flex items-center justify-center">
          <div className="h-9 w-9 rounded-full border-2 border-primary-sendlib border-t-transparent animate-spin" />
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}