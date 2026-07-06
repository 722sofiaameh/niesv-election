"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

import { NiesvHeader } from "@/components/voter/niesv-header";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/admin/election", label: "Election" },
  { href: "/admin/candidates", label: "Candidates" },
  { href: "/admin/voters", label: "Voters" },
  { href: "/admin/results", label: "Results" },
];

function AdminNavLinks({
  pathname,
  className,
}: {
  pathname: string;
  className?: string;
}) {
  return (
    <ul className={className}>
      {navItems.map((item) => (
        <li key={item.href} className="shrink-0">
          <Link
            href={item.href}
            className={cn(
              "admin-nav-link whitespace-nowrap",
              pathname.startsWith(item.href) && "admin-nav-link-active",
            )}
          >
            {item.label}
          </Link>
        </li>
      ))}
    </ul>
  );
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="voter-theme flex h-screen flex-col overflow-hidden bg-background">
      <div className="shrink-0">
        <NiesvHeader
          subtitle="Admin Dashboard"
          actions={
            <button
              type="button"
              className="voter-btn-secondary px-5 py-2 text-base"
              onClick={() => signOut({ callbackUrl: "/admin/login" })}
            >
              Sign out
            </button>
          }
        />

        <nav className="border-b border-border bg-background px-6 py-3 md:hidden">
          <AdminNavLinks
            pathname={pathname}
            className="flex gap-2 overflow-x-auto"
          />
        </nav>
      </div>

      <div className="mx-auto flex min-h-0 w-full max-w-6xl flex-1">
        <aside className="hidden w-52 shrink-0 border-r border-border bg-background px-6 py-8 md:block">
          <AdminNavLinks pathname={pathname} className="space-y-2" />
        </aside>

        <main className="min-h-0 flex-1 overflow-y-auto px-6 py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
