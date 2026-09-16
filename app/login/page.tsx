"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import { GithubIcon } from "@hugeicons/core-free-icons";
import AuthShell from "@/components/auth/AuthShell";
import { FormField } from "@/components/auth/FormField";
import { useLogin, useCompleteTwoFactorLogin, useMe } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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

  const socialButtons = (
    <div className="space-y-md">
      <button
        type="button"
        onClick={() => {
          window.location.href = "/api/auth/github";
        }}
        className="w-full font-label-sm text-label-sm bg-emerald-500 text-black h-12 flex items-center justify-center gap-md rounded-xl transition-transform active:scale-95 hover:bg-emerald-600 shadow-none cursor-pointer"
      >
        <HugeiconsIcon icon={GithubIcon} className="w-5 h-5" />
        Continue with GitHub
      </button>

      <button
        type="button"
        onClick={() => {
          window.location.href = "/api/auth/google";
        }}
        className="w-full font-label-sm text-label-sm border border-outline-variant text-on-surface bg-surface h-12 flex items-center justify-center gap-md rounded-xl transition-transform active:scale-95 hover:bg-surface-container-low cursor-pointer"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
          <path
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            fill="#4285F4"
          />
          <path
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            fill="#34A853"
          />
          <path
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            fill="#FBBC05"
          />
          <path
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            fill="#EA4335"
          />
        </svg>
        Continue with Google
      </button>
    </div>
  );

  return (
    <AuthShell
      title="Welcome to Sendlib"
      subtitle="Log in or create an account to manage your API keys and start sending emails in seconds."
    >
      <div className="space-y-md">
        {socialButtons}

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
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                required
                className="h-12 rounded-xl bg-surface px-4 text-center text-lg tracking-[0.4em] font-mono"
                placeholder="000000"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, ""))}
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
              disabled={complete2fa.isPending || code.length !== 6}
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
