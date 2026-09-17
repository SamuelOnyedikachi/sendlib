"use client";

import AuthShell from "@/components/auth/AuthShell";
import { Button } from "@/components/ui/button";
import { useMe, useResendVerification, useVerifyEmail } from "@/hooks/useAuth";
import { Cancel01Icon, CheckmarkCircleIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { toast } from "sonner";

type VerifyState =
  | { status: "verifying" }
  | { status: "verified" }
  | { status: "error"; reason: "invalid" | "expired" | "used" | "unknown"; message: string }
  | { status: "idle" };

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const { hasToken } = useMe();
  const verify = useVerifyEmail();
  const resend = useResendVerification();

  const [state, setState] = useState<VerifyState>({ status: "verifying" });
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (!token) {
      setState({
        status: "error",
        reason: "invalid",
        message: "This verification link is missing. Request a new one below.",
      });
      return;
    }
    verify.mutate(
      { token },
      {
        onSuccess: () => {
          toast.success("Email verified!");
          setState({ status: "verified" });
        },
        onError: (err: unknown) => {
          const message = err instanceof Error ? err.message : "This verification link is invalid.";
          const code = (err as { code?: string }).code;
          setState({
            status: "error",
            reason: code === "expired" || code === "used" || code === "invalid" ? code : "unknown",
            message,
          });
        },
      }
    );
  }, [token, verify]);

  const handleResend = () => {
    setResending(true);
    resend.mutate(undefined, {
      onSuccess: (res) => {
        setResending(false);
        toast.success(res.message ?? "A new verification email has been sent.");
        setState({ status: "idle" });
      },
      onError: (err: unknown) => {
        setResending(false);
        toast.error(err instanceof Error ? err.message : "Could not resend the email.");
      },
    });
  };

  return (
    <AuthShell
      title="Email verification"
      subtitle="Confirm your email address to secure your Sendlib account."
    >
      <div className="space-y-md text-center py-4">
        {state.status === "verifying" && (
          <>
            <div className="mx-auto h-10 w-10 rounded-full border-2 border-primary-sendlib border-t-transparent animate-spin" />
            <p className="font-body-md text-body-md text-on-surface-variant">
              Verifying your email address...
            </p>
          </>
        )}

        {state.status === "verified" && (
          <>
            <HugeiconsIcon
              icon={CheckmarkCircleIcon}
              size={48}
              className="mx-auto text-emerald-400"
            />
            <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
              Your email address has been verified. Your account is fully active.
            </p>
            <Button
              className="w-full h-12 rounded-xl font-label-sm text-label-sm bg-primary-sendlib text-black hover:opacity-90"
              onClick={() => router.push("/dashboard")}
            >
              Go to dashboard
            </Button>
          </>
        )}

        {state.status === "error" && (
          <>
            <HugeiconsIcon icon={Cancel01Icon} size={48} className="mx-auto text-red-400" />
            <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed py-2">
              {state.message}
            </p>

            <div className="space-y-3">
              {hasToken ? (
                <Button
                  onClick={handleResend}
                  disabled={resending}
                  className="w-full h-12 rounded-xl font-label-sm text-label-sm bg-primary-sendlib text-black hover:opacity-90"
                >
                  {resending ? "Sending..." : "Send a new verification email"}
                </Button>
              ) : (
                <Link
                  href="/login"
                  className="block w-full h-12 rounded-xl font-label-sm text-label-sm bg-primary-sendlib text-black hover:opacity-90 flex items-center justify-center"
                >
                  Log in to resend a verification email
                </Link>
              )}
            </div>
          </>
        )}

        {state.status === "idle" && (
          <>
            <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
              A fresh verification email is on its way. While you wait, explore your dashboard.
            </p>
            <Button
              className="w-full h-12 rounded-xl font-label-sm text-label-sm bg-primary-sendlib text-black hover:opacity-90"
              onClick={() => router.push("/dashboard")}
            >
              Go to dashboard
            </Button>
          </>
        )}
      </div>
    </AuthShell>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background-sendlib flex items-center justify-center">
          <div className="h-9 w-9 rounded-full border-2 border-primary-sendlib border-t-transparent animate-spin" />
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
