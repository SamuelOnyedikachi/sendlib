import { DocsNavLink } from "@/components/docs/DocsNavLink";
import { DocsSidebar } from "@/components/docs/Sidebar";
import Link from "next/link";

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background-sendlib text-on-background font-sans selection:bg-primary-sendlib/20 selection:text-primary-sendlib flex flex-col pt-16">
      {/* Top Navbar specifically for Docs */}
      <nav className="fixed top-0 left-0 right-0 h-16 border-b border-outline-variant bg-background-sendlib z-50 flex items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <span className="font-bold text-lg text-white tracking-tight">Sendlib</span>
          </Link>
        </div>
        <div className="flex items-center gap-4">
          <DocsNavLink />
        </div>
      </nav>

      {/* Main Dual Pane Layout */}
      <div className="flex flex-1 max-w-[1400px] w-full mx-auto">
        <DocsSidebar />
        <main className="flex-1 w-full p-6 md:p-12 lg:p-16 overflow-y-auto max-w-4xl">
          {children}
        </main>
      </div>
    </div>
  );
}
