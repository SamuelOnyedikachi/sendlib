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

export default function AuthShell({ title, subtitle, backHref = "/", children }: AuthShellProps) {
  return (
    <SEO title={title} description={subtitle}>
      <div className="h-screen w-full grid grid-cols-1 md:grid-cols-2 bg-background-sendlib overflow-hidden">
        {/* Left side: form */}
        <div className="h-full overflow-y-auto flex flex-col justify-between p-6 sm:p-8 lg:p-10 relative">
          <div>
            <Link
              href={backHref}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-secondary hover:text-primary-sendlib transition-colors"
            >
              <HugeiconsIcon icon={ArrowLeft01Icon} size={16} />
              Back to Home
            </Link>
          </div>

          <div className="w-full max-w-[440px] mx-auto my-auto py-2">
            <div className="space-y-1 mb-4">
              <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-primary-sendlib">{title}</h1>
              <p className="text-xs sm:text-sm text-secondary leading-relaxed">{subtitle}</p>
            </div>
            {children}
          </div>

          <div className="text-[11px] text-secondary/60 text-center pt-2">
            Sendlib &copy; {new Date().getFullYear()}
          </div>
        </div>

        {/* Right side: forest illustration */}
        <div
          className="hidden md:flex flex-col justify-between p-8 lg:p-12 relative overflow-hidden h-full"
          style={{
            backgroundImage:
              "linear-gradient(rgba(20, 27, 38, 0.75), rgba(20, 27, 38, 0.75)), url('/forest_background/forest-background.webp')",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <Link
            href="/"
            className="flex items-center gap-2 text-xl font-bold text-white relative z-10 hover:opacity-90 transition-opacity"
          >
            <span>Sendlib</span>
          </Link>
          <div className="relative z-10 max-w-[520px]">
            <h2 className="text-2xl lg:text-3xl font-bold text-white leading-snug">
              Stop fighting SMTP configuration.
            </h2>
            <p className="text-sm lg:text-base text-white/80 mt-2 leading-relaxed">
              A secure API designed for developers to send transactional emails instantly to their customers.
            </p>
          </div>
        </div>
      </div>
    </SEO>
  );
}