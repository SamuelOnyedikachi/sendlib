"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import AuthShell from "@/components/auth/AuthShell";
import { FormField } from "@/components/auth/FormField";
import { useSignup, useMe } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { passwordSchema } from "@/lib/auth/passwordPolicy";
import { SocialButtons } from "@/components/auth/SocialButtons";

const PASSWORD_HINTS = [
  "At least 8 characters",
  "At least one letter",
  "At least one number",
];

export default function SignupPage() {
  const router = useRouter();
  const { data: user, isLoading } = useMe();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<string | null>(null);

  const signup = useSignup();

  useEffect(() => {
    if (!isLoading && user) {
      router.push("/dashboard");
    }
  }, [isLoading, user, router]);

  if (isLoading || user) {
    return (
      <div className="min-h-screen bg-background-sendlib flex flex-col items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-9 w-9 rounded-full border-2 border-primary-sendlib border-t-transparent animate-spin" />
          <p className="text-sm font-medium text-secondary font-sans animate-pulse">
            Authenticating...
          </p>
        </div>
      </div>
    );
  }

  const handleSignup = (event: React.FormEvent) => {
    event.preventDefault();
    setFieldError(null);
    setPasswordError(null);

    const parsed = passwordSchema.safeParse(password);
    if (!parsed.success) {
      setPasswordError(parsed.error.issues[0]?.message ?? "Invalid password.");
      return;
    }

    signup.mutate(
      { email, password },
      {
        onSuccess: (res) => {
          toast.success("Account created. Welcome to Sendlib!");
          if (res.verificationPending && !res.verificationEmailSent) {
            toast.info(
              "We couldn't send the verification email yet. You can resend it from Security.",
            );
          } else if (res.verificationPending) {
            toast.info(
              "We sent a verification email. Check your inbox to confirm your address.",
            );
          }
          router.push("/dashboard");
        },
        onError: (err: unknown) => {
          setFieldError(
            err instanceof Error
              ? err.message
              : typeof err === "string"
                ? err
                : "Login failed. Please try again.",
          );
        },
      },
    );
  };

  return (
    <AuthShell
      title="Create your account"
      subtitle="Free forever for small senders. No credit card required."
    >
      <div className="space-y-3">
        <SocialButtons />

        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-outline-variant" />
          <span className="font-label-xs text-[11px] text-on-surface-variant">
            or
          </span>
          <div className="h-px flex-1 bg-outline-variant" />
        </div>

        <form onSubmit={handleSignup} className="space-y-3" noValidate>
          <FormField label="Email address" htmlFor="signup-email">
            <Input
              id="signup-email"
              type="email"
              autoComplete="email"
              required
              className="h-10 rounded-lg bg-surface px-3 text-sm"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </FormField>

          <FormField
            label="Password"
            htmlFor="signup-password"
            error={passwordError ?? undefined}
          >
            <div className="relative">
              <Input
                id="signup-password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                required
                className="h-10 rounded-lg bg-surface px-3 pr-10 text-sm"
                placeholder="Create a password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setPasswordError(null);
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface focus:outline-none cursor-pointer"
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" x2="22" y1="2" y2="22"/></svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                )}
              </button>
            </div>
          </FormField>

          <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-secondary">
            {PASSWORD_HINTS.map((hint) => (
              <span key={hint} className="inline-flex items-center gap-1">
                <span className="h-1 w-1 rounded-full bg-primary-sendlib inline-block" />
                {hint}
              </span>
            ))}
          </div>

          {fieldError && (
            <p
              className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-1.5"
              role="alert"
            >
              {fieldError}
            </p>
          )}

          <Button
            type="submit"
            disabled={signup.isPending}
            className="w-full h-10 rounded-lg font-label-sm text-sm font-bold bg-primary-sendlib text-black hover:opacity-90 cursor-pointer"
          >
            {signup.isPending ? "Creating account..." : "Create account"}
          </Button>
        </form>

        <p className="text-[11px] text-center text-on-surface-variant max-w-[340px] mx-auto leading-relaxed">
          By creating an account, you agree to our{" "}
          <Link
            href="/terms-of-service"
            className="underline hover:text-primary-sendlib"
          >
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link
            href="/privacy-policy"
            className="underline hover:text-primary-sendlib"
          >
            Privacy Policy
          </Link>
          .
        </p>

        <p className="text-xs text-center text-on-surface-variant pt-0.5">
          Already have an account?{" "}
          <Link
            href="/login"
            className="text-primary-sendlib font-semibold underline underline-offset-4"
          >
            Log in
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}
