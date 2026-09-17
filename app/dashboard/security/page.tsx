"use client";

import { useState } from "react";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import { Shield01Icon, PasswordValidationIcon, MailValidationIcon } from "@hugeicons/core-free-icons";
import { TwoFactorSection } from "@/components/security/TwoFactorSection";
import { FormField } from "@/components/auth/FormField";
import { useMe, useResendVerification, useChangePassword } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { passwordSchema } from "@/lib/auth/passwordPolicy";

export default function SecurityPage() {
  const { data: user, isLoading } = useMe();
  const resend = useResendVerification();
  const changePassword = useChangePassword();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);

  if (isLoading || !user) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <div className="h-9 w-9 rounded-full border-2 border-primary-sendlib border-t-transparent animate-spin" />
        <p className="text-sm text-secondary">Loading security settings...</p>
      </div>
    );
  }

  const isVerified = Boolean(user.emailVerified);

  const handleResend = () => {
    resend.mutate(undefined, {
      onSuccess: (res) => {
        toast.success(res.message ?? "A new verification email has been sent.");
      },
      onError: (err: unknown) => {
        toast.error(err instanceof Error ? err.message : "Could not send the verification email.");
      },
    });
  };

  const handleChangePassword = (event: React.FormEvent) => {
    event.preventDefault();
    setPasswordError(null);

    const parsed = passwordSchema.safeParse(newPassword);
    if (!parsed.success) {
      setPasswordError(parsed.error.issues[0]?.message ?? "Invalid password.");
      return;
    }

    changePassword.mutate(
      { currentPassword, newPassword },
      {
        onSuccess: (res) => {
          toast.success(res.message ?? "Password changed.");
          setCurrentPassword("");
          setNewPassword("");
        },
        onError: (err: unknown) => {
          setPasswordError(err instanceof Error ? err.message : "Could not change password.");
        },
      }
    );
  };

  return (
    <div className="max-w-3xl mx-auto px-4 md:px-6 py-8 space-y-6">
      <div>
        <h1 className="font-headline-lg text-headline-lg text-on-background font-bold">
          Security
        </h1>
        <p className="text-secondary mt-1">
          Manage email verification, two-factor authentication, and your password.
        </p>
      </div>

      {/* Email verification */}
      <div className="rounded-2xl border border-outline-variant bg-surface p-6 space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <HugeiconsIcon icon={MailValidationIcon} size={22} className="mt-0.5 text-primary-sendlib" />
            <div>
              <h2 className="font-headline-md text-headline-md text-on-background font-bold">
                Email verification
              </h2>
              <p className="text-sm text-secondary mt-1">
                {isVerified
                  ? `Verified: ${user.email ?? "your email"}.`
                  : `Not verified: confirm ${user.email ?? "your email"} to secure your account.`}
              </p>
            </div>
          </div>
          <span
            className={`shrink-0 inline-flex items-center rounded-full px-3 py-1 text-xs font-medium border ${
              isVerified
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                : "bg-amber-500/10 text-amber-300 border-amber-500/30"
            }`}
          >
            {isVerified ? "Verified" : "Pending"}
          </span>
        </div>

        {!isVerified && (
          <Button
            variant="outline"
            onClick={handleResend}
            disabled={resend.isPending}
            className="rounded-lg font-label-sm border border-outline-variant hover:bg-surface-container-low"
          >
            {resend.isPending ? "Sending..." : "Resend verification email"}
          </Button>
        )}
      </div>

      {/* Two-factor authentication */}
      <TwoFactorSection />

      {/* Change password */}
      <div className="rounded-2xl border border-outline-variant bg-surface p-6 space-y-4">
        <div className="flex items-start gap-3">
          <HugeiconsIcon icon={PasswordValidationIcon} size={22} className="mt-0.5 text-primary-sendlib" />
          <div>
            <h2 className="font-headline-md text-headline-md text-on-background font-bold">
              Change password
            </h2>
            <p className="text-sm text-secondary mt-1">
              Changing your password signs you out of every other device.
            </p>
          </div>
        </div>

        {!user.hasPassword ? (
          <p className="text-sm text-amber-300 bg-amber-500/10 border border-amber-500/30 rounded-lg px-3 py-2">
            This account was created with a social login and has no password yet.
          </p>
        ) : (
          <form onSubmit={handleChangePassword} className="sm:flex sm:gap-4 gap-3 items-end flex-wrap" noValidate>
            <div className="sm:flex-1 min-w-52">
              <FormField label="Current password" htmlFor="current-password">
                <Input
                  id="current-password"
                  type="password"
                  autoComplete="current-password"
                  required
                  className="h-11 rounded-xl bg-background-sendlib px-3"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                />
              </FormField>
            </div>
            <div className="sm:flex-1 min-w-52">
              <FormField label="New password" htmlFor="new-password" error={passwordError ?? undefined}>
                <Input
                  id="new-password"
                  type="password"
                  autoComplete="new-password"
                  required
                  className="h-11 rounded-xl bg-background-sendlib px-3"
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    setPasswordError(null);
                  }}
                />
              </FormField>
            </div>
            <Button
              type="submit"
              disabled={changePassword.isPending || !currentPassword || !newPassword}
              className="h-11 rounded-xl font-label-sm bg-primary-sendlib text-black hover:opacity-90"
            >
              {changePassword.isPending ? "Saving..." : "Update password"}
            </Button>
          </form>
        )}
      </div>

      <p className="text-xs text-secondary flex items-start gap-2">
        <HugeiconsIcon icon={Shield01Icon} size={14} className="mt-0.5 shrink-0" />
        Sessions are revoked server-side when your password or 2FA settings change.
      </p>
    </div>
  );
}