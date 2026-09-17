"use client";

import AuthShell from "@/components/auth/AuthShell";
import { FormField } from "@/components/auth/FormField";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useForgotPassword } from "@/hooks/useAuth";
import { CheckmarkCircleIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const forgot = useForgotPassword();

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!email.trim()) return;
    forgot.mutate(
      { email: email.trim() },
      {
        onSuccess: () => {
          setSubmitted(true);
          setCooldown(30);
        },
        onError: () => {
          setSubmitted(true);
          setCooldown(30);
        },
      }
    );
  };

  const handleResend = () => {
    if (cooldown > 0 || forgot.isPending || !email.trim()) return;
    forgot.mutate(
      { email: email.trim() },
      {
        onSuccess: () => {
          toast.success("Reset link resent. Please check your inbox.");
          setCooldown(30);
        },
        onError: () => {
          toast.success("Reset link resent. Please check your inbox.");
          setCooldown(30);
        },
      }
    );
  };

  return (
    <AuthShell
      title="Reset your password"
      subtitle="We'll email you a secure, single-use link to set a new password."
    >
      {submitted ? (
        <div className="space-y-4 text-center py-4">
          <HugeiconsIcon
            icon={CheckmarkCircleIcon}
            size={40}
            className="mx-auto text-emerald-400"
          />
          <div className="space-y-1.5">
            <p className="text-xs text-on-surface-variant leading-relaxed">
              If an account exists for{" "}
              <span className="text-primary-sendlib font-semibold">{email}</span>, you will receive
              a password reset link shortly. The link expires in 30 minutes.
            </p>
            <p className="text-[11px] text-secondary">
              Did not get it? Check your spam folder or click resend below.
            </p>
          </div>

          <div className="space-y-2 pt-2">
            <Button
              type="button"
              onClick={handleResend}
              disabled={cooldown > 0 || forgot.isPending}
              className="w-full h-10 rounded-lg text-sm font-bold bg-primary-sendlib text-black hover:opacity-90 disabled:opacity-50 cursor-pointer"
            >
              {forgot.isPending
                ? "Resending..."
                : cooldown > 0
                  ? `Resend in ${cooldown}s`
                  : "Resend reset email"}
            </Button>

            <button
              type="button"
              onClick={() => {
                setSubmitted(false);
                setCooldown(0);
              }}
              className="w-full text-xs text-secondary hover:text-primary-sendlib py-1 cursor-pointer transition-colors"
            >
              Try a different email
            </button>
          </div>

          <p className="text-xs text-center text-on-surface-variant pt-2 border-t border-outline-variant/60">
            <Link
              href="/login"
              className="text-primary-sendlib font-semibold underline underline-offset-4"
            >
              Back to login
            </Link>
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3" noValidate>
          <FormField label="Email address" htmlFor="forgot-email">
            <Input
              id="forgot-email"
              type="email"
              autoComplete="email"
              required
              className="h-10 rounded-lg bg-surface px-3 text-sm"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </FormField>

          <Button
            type="submit"
            disabled={forgot.isPending || !email.trim()}
            className="w-full h-10 rounded-lg text-sm font-bold bg-primary-sendlib text-black hover:opacity-90 cursor-pointer disabled:opacity-50"
          >
            {forgot.isPending ? "Sending..." : "Send reset link"}
          </Button>

          <p className="text-xs text-center text-on-surface-variant pt-1">
            Remembered it?{" "}
            <Link
              href="/login"
              className="text-primary-sendlib font-semibold underline underline-offset-4"
            >
              Back to login
            </Link>
          </p>
        </form>
      )}
    </AuthShell>
  );
}
