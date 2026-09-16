"use client";

import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeft01Icon } from "@hugeicons/core-free-icons";
import SEO from "@/components/SEO";

interface AuthShellProps {
  title: string;
  subtitle: string;
  backHref?: string;
  children: React.ReactNode;
}

/** Shared two-pane layout for all public authentication pages. */
export default function AuthShell({ title, subtitle, backHref = "/", children }: AuthShellProps) {
  return (
    <SEO title={title} description={subtitle}>
      <div className="min-h-screen grid grid-cols-1 md:grid-cols-2 bg-background-sendlib">
        {/* Left side: form */}
        <div className="flex flex-col justify-center px-margin-mobile md:px-margin-desktop py-xl relative">
          <Link
            href={backHref}
            className="absolute top-8 left-8 md:left-12 font-label-sm text-label-sm text-secondary hover:text-primary-sendlib flex items-center gap-xs transition-colors"
          >
            <HugeiconsIcon icon={ArrowLeft01Icon} size={20} />
            Back to Home
          </Link>

          <div className="w-full max-w-105 mx-auto space-y-xl">
            <div className="space-y-sm">
              <h1 className="font-headline-lg text-headline-lg text-primary-sendlib">{title}</h1>
              <p className="font-body-md text-body-md text-on-surface-variant">{subtitle}</p>
            </div>
            {children}
          </div>
        </div>

        {/* Right side: forest illustration */}
        <div
          className="hidden md:flex flex-col justify-between p-8 relative overflow-hidden"
          style={{
            backgroundImage:
              "linear-gradient(rgba(29, 43, 62, 0.65), rgba(29, 43, 62, 0.65)), url('/forest_background/forest-background.webp')",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <Link
            href="/"
            className="flex items-center gap-2 font-headline-md text-headline-md font-bold text-white relative z-10 hover:opacity-90 transition-opacity"
          >
            <span>Sendlib</span>
          </Link>
          <div className="relative z-10">
            <h2 className="font-headline-lg text-headline-lg text-white leading-tight">
              Stop fighting SMTP configuration.
            </h2>
            <p className="font-body-lg text-body-lg text-white/90 mt-2">
              A secure API designed for developers to send transactional emails instantly to their
              customers.
            </p>
          </div>
        </div>
      </div>
    </SEO>
  );
}