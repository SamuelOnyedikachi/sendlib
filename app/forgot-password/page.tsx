"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckmarkCircleIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import AuthShell from "@/components/auth/AuthShell";
import { FormField } from "@/components/auth/FormField";
import { useForgotPassword } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const forgot = useForgotPassword();

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    forgot.mutate(
      { email },
      {
        // Generic response — never reveals whether the account exists.
        onSuccess: () => setSubmitted(true),
        onError: () => setSubmitted(true),
      }
    );
  };

  return (
    <AuthShell
      title="Reset your password"
      subtitle="We'll email you a secure, single-use link to set a new password."
    >
      {submitted ? (
        <div className="space-y-md text-center py-6">
          <HugeiconsIcon
            icon={CheckmarkCircleIcon}
            size={48}
            className="mx-auto text-emerald-400"
          />
          <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
            If an account exists for <span className="text-primary-sendlib">{email}</span>,
            you&apos;ll receive a password reset link shortly. The link expires in 30 minutes.
          </p>
          <p className="font-label-sm text-label-sm text-secondary">
            Didn&apos;t get it? Check your spam folder or try again.
          </p>
          <Link
            href="/login"
            className="block font-label-sm text-label-sm text-primary-sendlib underline underline-offset-4"
          >
            Back to login
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-md" noValidate>
          <FormField label="Email address" htmlFor="forgot-email">
            <Input
              id="forgot-email"
              type="email"
              autoComplete="email"
              required
              className="h-12 rounded-xl bg-surface px-4"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </FormField>

          <Button
            type="submit"
            disabled={forgot.isPending}
            className="w-full h-12 rounded-xl font-label-sm text-label-sm bg-primary-sendlib text-black hover:opacity-90"
          >
            {forgot.isPending ? "Sending..." : "Send reset link"}
          </Button>

          <p className="font-label-sm text-label-sm text-center text-on-surface-variant">
            Remembered it?{" "}
            <Link href="/login" className="text-primary-sendlib underline underline-offset-4">
              Back to login
            </Link>
          </p>
        </form>
      )}
    </AuthShell>
  );
}