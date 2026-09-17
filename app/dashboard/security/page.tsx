"use client";

import { FormField } from "@/components/auth/FormField";
import { TwoFactorSection } from "@/components/security/TwoFactorSection";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useChangePassword, useMe } from "@/hooks/useAuth";
import { passwordSchema } from "@/lib/auth/passwordPolicy";
import { PasswordValidationIcon, Shield01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useState } from "react";
import { toast } from "sonner";

export default function SecurityPage() {
  const { data: user, isLoading } = useMe();
  const changePassword = useChangePassword();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  if (isLoading || !user) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <div className="h-9 w-9 rounded-full border-2 border-primary-sendlib border-t-transparent animate-spin" />
        <p className="text-sm text-secondary">Loading security settings...</p>
      </div>
    );
  }

  const handleChangePassword = (event: React.FormEvent) => {
    event.preventDefault();
    setPasswordError(null);

    const parsed = passwordSchema.safeParse(newPassword);
    if (!parsed.success) {
      setPasswordError(parsed.error.issues[0]?.message ?? "Invalid password.");
      return;
    }

    if (user.twoFactorEnabled && !twoFactorCode) {
      setPasswordError("Please enter your 2FA code.");
      return;
    }

    changePassword.mutate(
      { currentPassword, newPassword, code: user.twoFactorEnabled ? twoFactorCode : undefined },
      {
        onSuccess: (res) => {
          toast.success(res.message ?? "Password changed.");
          setCurrentPassword("");
          setNewPassword("");
          setTwoFactorCode("");
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
        <h1 className="font-headline-lg text-headline-lg text-on-background font-bold">Security</h1>
        <p className="text-secondary mt-1">Manage two-factor authentication and your password.</p>
      </div>

      {/* Two-factor authentication */}
      <TwoFactorSection />

      {/* Change password */}
      <div className="rounded-2xl border border-outline-variant bg-surface p-6 space-y-4">
        <div className="flex items-start gap-3">
          <HugeiconsIcon
            icon={PasswordValidationIcon}
            size={22}
            className="mt-0.5 text-primary-sendlib"
          />
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
          <form
            onSubmit={handleChangePassword}
            className="sm:flex sm:gap-4 gap-3 items-end flex-wrap"
            noValidate
          >
            <div className="sm:flex-1 min-w-52">
              <FormField label="Current password" htmlFor="current-password">
                <div className="relative">
                  <Input
                    id="current-password"
                    type={showCurrentPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    className="h-11 rounded-xl bg-background-sendlib px-3 pr-10"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface focus:outline-none cursor-pointer"
                  >
                    {showCurrentPassword ? (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                        <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                        <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                        <line x1="2" x2="22" y1="2" y2="22" />
                      </svg>
                    ) : (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
              </FormField>
            </div>
            <div className="sm:flex-1 min-w-52">
              <FormField
                label="New password"
                htmlFor="new-password"
                error={passwordError ?? undefined}
              >
                <div className="relative">
                  <Input
                    id="new-password"
                    type={showNewPassword ? "text" : "password"}
                    autoComplete="new-password"
                    required
                    className="h-11 rounded-xl bg-background-sendlib px-3 pr-10"
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      setPasswordError(null);
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface focus:outline-none cursor-pointer"
                  >
                    {showNewPassword ? (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                        <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                        <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                        <line x1="2" x2="22" y1="2" y2="22" />
                      </svg>
                    ) : (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
              </FormField>
            </div>
            {user.twoFactorEnabled && (
              <div className="sm:flex-1 min-w-52">
                <FormField label="Authenticator code" htmlFor="2fa-code">
                  <Input
                    id="2fa-code"
                    type="text"
                    autoComplete="one-time-code"
                    required
                    className="h-11 rounded-xl bg-background-sendlib px-3 font-mono text-center"
                    placeholder="6-digit or recovery code"
                    value={twoFactorCode}
                    onChange={(e) => {
                      setTwoFactorCode(e.target.value.trim());
                      setPasswordError(null);
                    }}
                  />
                </FormField>
              </div>
            )}
            <Button
              type="submit"
              disabled={
                changePassword.isPending ||
                !currentPassword ||
                !newPassword ||
                (user.twoFactorEnabled && twoFactorCode.length < 6)
              }
              className="h-11 rounded-xl font-label-sm bg-primary-sendlib text-black hover:opacity-90 cursor-pointer mt-auto"
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
