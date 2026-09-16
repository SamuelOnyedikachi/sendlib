"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import AuthShell from "@/components/auth/AuthShell";
import { FormField } from "@/components/auth/FormField";
import { useLogin, useCompleteTwoFactorLogin, useMe } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SocialButtons } from "@/components/auth/SocialButtons";

const OAUTH_ERRORS: Record<string, string> = {
  invalid_state_or_code: "The sign-in link expired. Please try again.",
  google_callback: "Google sign-in failed. Please try again.",
  google_profile:
    "Google did not return a profile. Please try again or use the email form.",
  github_token: "GitHub sign-in failed. Please try again.",
  github_callback: "GitHub sign-in failed. Please try again.",
};

function getOAuthError(): { message: string } | null {
  if (typeof window === "undefined") return null;
  const error = new URLSearchParams(window.location.search).get("error");
  if (!error) return null;
  return {
    message: OAUTH_ERRORS[error] ?? "Authentication failed. Please try again.",
  };
}

export default function LoginPage() {
  const router = useRouter();

  const { data: user, isLoading } = useMe();

  const [step, setStep] = useState<"credentials" | "twoFactor">("credentials");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [fieldError, setFieldError] = useState<string | null>(null);

  const login = useLogin();
  const complete2fa = useCompleteTwoFactorLogin();

  const nextPath =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search).get("next")
      : null;

  useEffect(() => {
    const oauth = getOAuthError();

    if (oauth) {
      toast.error(oauth.message);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  useEffect(() => {
    if (!isLoading && user) {
      router.push(
        nextPath && nextPath.startsWith("/dashboard") ? nextPath : "/dashboard",
      );
    }
  }, [isLoading, user, router, nextPath]);

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

  const handleLogin = (event: React.FormEvent) => {
    event.preventDefault();
    setFieldError(null);
    login.mutate(
      { email, password },
      {
        onSuccess: (res) => {
          if (res.requiresTwoFactor) {
            setStep("twoFactor");
            return;
          }
          toast.success("Logged in successfully.");
          router.push(
            nextPath && nextPath.startsWith("/dashboard")
              ? nextPath
              : "/dashboard",
          );
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

  const handleTwoFactor = (event: React.FormEvent) => {
    event.preventDefault();
    setFieldError(null);
    complete2fa.mutate(
      { code },
      {
        onSuccess: () => {
          toast.success("Two-factor verified. Logged in.");
          router.push(
            nextPath && nextPath.startsWith("/dashboard")
              ? nextPath
              : "/dashboard",
          );
        },
        onError: (err: unknown) => {
          setFieldError(
            err instanceof Error
              ? err.message
              : "Invalid code. Please try again.",
          );
          setCode("");
        },
      },
    );
  };



  const normalizedTwoFactorCode = code.replace(/[- ]/g, "");
  const isTwoFactorCodeValid =
    /^\d{6}$/.test(code) || /^[A-F0-9]{16}$/.test(normalizedTwoFactorCode);

  return (
    <AuthShell
      title="Welcome to Sendlib"
      subtitle="Log in or create an account to manage your API keys and start sending emails in seconds."
    >
      <div className="space-y-md">
      <SocialButtons />

        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-outline-variant" />
          <span className="font-label-xs text-label-xs text-on-surface-variant">
            or
          </span>
          <div className="h-px flex-1 bg-outline-variant" />
        </div>

        {step === "credentials" ? (
          <form onSubmit={handleLogin} className="space-y-md" noValidate>
            <FormField label="Email address" htmlFor="login-email">
              <Input
                id="login-email"
                type="email"
                autoComplete="email"
                required
                className="h-12 rounded-xl bg-surface px-4"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </FormField>

            <FormField label="Password" htmlFor="login-password">
              <Input
                id="login-password"
                type="password"
                autoComplete="current-password"
                required
                className="h-12 rounded-xl bg-surface px-4"
                placeholder="Your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </FormField>

            <div className="flex items-center justify-between">
              <Link
                href="/forgot-password"
                className="font-label-sm text-label-sm text-secondary hover:text-primary-sendlib underline underline-offset-4"
              >
                Forgot your password?
              </Link>
            </div>

            {fieldError && (
              <p
                className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2"
                role="alert"
              >
                {fieldError}
              </p>
            )}

            <Button
              type="submit"
              disabled={login.isPending}
              className="w-full h-12 rounded-xl font-label-sm text-label-sm bg-primary-sendlib text-black hover:opacity-90"
            >
              {login.isPending ? "Logging in..." : "Log in"}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleTwoFactor} className="space-y-md" noValidate>
            <p className="font-body-md text-body-md text-on-surface-variant">
              Enter the 6-digit code from your authenticator app to finish
              signing in.
            </p>
            <FormField label="Authenticator code" htmlFor="login-2fa-code">
              <Input
                id="login-2fa-code"
                inputMode="text"
                autoComplete="one-time-code"
                maxLength={19}
                required
                className="h-12 rounded-xl bg-surface px-4 text-center text-lg tracking-[0.4em] font-mono"
                placeholder="000000 or XXXX-XXXX-XXXX-XXXX"
                value={code}
                onChange={(e) =>
                  setCode(
                    e.target.value
                      .toUpperCase()
                      .replace(/[^A-Z0-9- ]/g, "")
                      .slice(0, 19),
                  )
                }
              />
            </FormField>

            {fieldError && (
              <p
                className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2"
                role="alert"
              >
                {fieldError}
              </p>
            )}

            <Button
              type="submit"
              disabled={complete2fa.isPending || !isTwoFactorCodeValid}
              className="w-full h-12 rounded-xl font-label-sm text-label-sm bg-primary-sendlib text-black hover:opacity-90"
            >
              {complete2fa.isPending ? "Verifying..." : "Verify & Log In"}
            </Button>

            <button
              type="button"
              onClick={() => {
                setStep("credentials");
                setCode("");
                setFieldError(null);
              }}
              className="w-full font-label-sm text-label-sm text-secondary hover:text-primary-sendlib"
            >
              &larr; Back to password
            </button>
          </form>
        )}

        <p className="font-label-sm text-label-sm text-center text-on-surface-variant">
          Don&apos;t have an account?{" "}
          <Link
            href="/signup"
            className="text-primary-sendlib underline underline-offset-4"
          >
            Create one
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}
