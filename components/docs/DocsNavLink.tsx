"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

/** Reads the auth cookie on the client and shows the appropriate nav link. */
export function DocsNavLink() {
  const [href, setHref] = useState<string | null>(null);
  const [label, setLabel] = useState("Dashboard");

  useEffect(() => {
    // Check for a session cookie without a network round-trip.
    // Cookie name is "token" based on the auth setup in this codebase.
    const hasSession = document.cookie.split(";").some((c) => c.trim().startsWith("token="));
    if (hasSession) {
      setHref("/dashboard");
      setLabel("Back to Dashboard");
    } else {
      setHref("/login");
      setLabel("Get Started");
    }
  }, []);

  if (!href) return null;

  return (
    <Link
      href={href}
      className="text-[13px] font-bold px-4 py-2 bg-surface hover:bg-surface-container-low rounded-lg text-primary-sendlib transition-colors border border-outline-variant"
    >
      {label}
    </Link>
  );
}
