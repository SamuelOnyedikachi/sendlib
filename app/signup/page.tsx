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
            toast.info("We couldn't send the verification email yet — resend it from Security.");
          } else if (res.verificationPending) {
            toast.info("We sent a verification email. Check your inbox to confirm your address.");
          }
          router.push("/dashboard");
        },
        onError: (err: unknown) => {
          setFieldError(err instanceof Error ? err.message : "Sign up failed. Please try again.");
        },
      }
    );
  };

  return (
    <AuthShell
      title="Create your account"
      subtitle="Free forever for small senders. No credit card required."
    >
      <form onSubmit={handleSignup} className="space-y-md" noValidate>
        <FormField label="Email address" htmlFor="signup-email">
          <Input
            id="signup-email"
            type="email"
            autoComplete="email"
            required
            className="h-12 rounded-xl bg-surface px-4"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </FormField>

        <FormField
          label="Password"
          htmlFor="signup-password"
          error={passwordError ?? undefined}
          hint="Choose a strong password with letters and numbers."
        >
          <Input
            id="signup-password"
            type="password"
            autoComplete="new-password"
            required
            className="h-12 rounded-xl bg-surface px-4"
            placeholder="Create a password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setPasswordError(null);
            }}
          />
        </FormField>

        <ul className="space-y-1">
          {PASSWORD_HINTS.map((hint) => (
            <li key={hint} className="flex items-center gap-2 text-xs text-secondary">
              <span className="h-1 w-1 rounded-full bg-primary-sendlib inline-block" />
              {hint}
            </li>
          ))}
        </ul>

        {fieldError && (
          <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2" role="alert">
            {fieldError}
          </p>
        )}

        <Button
          type="submit"
          disabled={signup.isPending}
          className="w-full h-12 rounded-xl font-label-sm text-label-sm bg-primary-sendlib text-black hover:opacity-90"
        >
          {signup.isPending ? "Creating account..." : "Create account"}
        </Button>
      </form>

      <p className="font-label-xs text-label-xs text-center text-on-surface-variant max-w-85 mx-auto leading-relaxed">
        By creating an account, you agree to our{" "}
        <Link href="/terms-of-service" className="underline hover:text-primary-sendlib">
          Terms of Service
        </Link>{" "}
        and{" "}
        <Link href="/privacy-policy" className="underline hover:text-primary-sendlib">
          Privacy Policy
        </Link>
        .
      </p>

      <p className="font-label-sm text-label-sm text-center text-on-surface-variant">
        Already have an account?{" "}
        <Link href="/login" className="text-primary-sendlib underline underline-offset-4">
          Log in
        </Link>
      </p>
    </AuthShell>
  );
}