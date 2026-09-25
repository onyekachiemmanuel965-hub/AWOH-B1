"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import {
  fetchMyAdminAccess,
  isStaffRole,
  type AdminAccessModule,
  type MyAdminAccess,
} from "@/lib/admin-api";
import { LoadingSpinner } from "@/components/feedback/feedback";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";

export function AdminShell({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [access, setAccess] = useState<MyAdminAccess | null>(null);
  const [accessError, setAccessError] = useState<string | null>(null);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace(`/login?next=${encodeURIComponent(pathname || "/admin")}`);
      return;
    }
    if (!isStaffRole(user.role)) {
      router.replace("/");
    }
  }, [user, loading, router, pathname]);

  useEffect(() => {
    if (!user || !isStaffRole(user.role)) return;
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchMyAdminAccess();
        if (!cancelled) {
          setAccess(data);
          setAccessError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setAccessError(
            err instanceof Error ? err.message : "Unable to load access.",
          );
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <LoadingSpinner label="Loading operations…" />
      </div>
    );
  }

  if (!user || !isStaffRole(user.role)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <LoadingSpinner label="Checking access…" />
      </div>
    );
  }

  const links: AdminAccessModule[] =
    access?.nav ??
    (accessError
      ? [{ key: "dashboard", label: "Dashboard", href: "/admin/dashboard" }]
      : []);

  return (
    <div className="min-h-screen bg-background text-text">
      <a
        href="#admin-main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-[100] focus:rounded-md focus:bg-primary focus:px-3 focus:py-2 focus:type-label focus:text-text-inverse"
      >
        Skip to operations content
      </a>
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div>
            <p className="type-caption uppercase tracking-[0.14em] text-accent">
              AWOH-B Operations
            </p>
            <p className="type-label text-primary">
              {user.firstName} {user.lastName}
              {access ? (
                <span className="text-text-muted">
                  {" "}
                  · {access.roleLabel}
                </span>
              ) : (
                <span className="text-text-muted"> · {user.role}</span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/" className="type-caption text-text-muted hover:text-primary">
              Storefront
            </Link>
            <Button variant="outline" size="sm" onClick={() => void logout()}>
              Sign out
            </Button>
          </div>
        </div>
      </header>
      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:grid-cols-[220px_1fr] sm:px-6">
        <nav
          className="flex flex-row gap-2 overflow-x-auto lg:flex-col lg:overflow-visible"
          aria-label="Operations"
        >
          {links.length === 0 && !accessError ? (
            <p className="type-caption text-text-muted px-1">Loading menu…</p>
          ) : (
            links.map((item) => {
              const active =
                pathname === item.href ||
                pathname?.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.key}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "whitespace-nowrap rounded-md border px-3 py-2 type-caption no-underline",
                    active
                      ? "border-primary bg-primary text-text-inverse"
                      : "border-border bg-surface text-primary hover:bg-surface-muted",
                  )}
                >
                  {item.label}
                </Link>
              );
            })
          )}
        </nav>
        <main id="admin-main" className="min-w-0" tabIndex={-1}>
          {children}
        </main>
      </div>
    </div>
  );
}
