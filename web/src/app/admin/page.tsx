"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import {
  fetchMyAdminAccess,
  type MyAdminAccess,
} from "@/lib/admin-api";
import {
  ErrorState,
  LoadingSpinner,
} from "@/components/feedback/feedback";

export default function AdminWorkspacePage() {
  const { user } = useAuth();
  const [access, setAccess] = useState<MyAdminAccess | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchMyAdminAccess();
        if (!cancelled) {
          setAccess(data);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Unable to load workspace.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  if (loading) return <LoadingSpinner label="Loading workspace…" />;
  if (error || !access) {
    return (
      <ErrorState
        title="Workspace unavailable"
        description={error ?? "Access could not be loaded."}
      />
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <p className="type-caption uppercase tracking-[0.16em] text-accent">
          Welcome to AWOH-B
        </p>
        <h1 className="mt-2 type-h1 text-primary">Operations workspace</h1>
        <p className="mt-2 max-w-2xl type-body text-text-muted">
          Your menu and tools are based on your assigned role. Backend
          authorization remains the source of truth — this page is
          informational.
        </p>
      </div>

      <section className="border border-border bg-surface p-6 space-y-6">
        <div>
          <p className="type-caption uppercase tracking-[0.14em] text-accent">
            Your role
          </p>
          <p className="mt-1 type-h2 text-primary">{access.roleLabel}</p>
          <p className="mt-1 type-body-sm text-text-muted">
            {access.firstName} {access.lastName}
          </p>
        </div>

        <div>
          <p className="type-caption uppercase tracking-[0.14em] text-accent">
            What you can access
          </p>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2 list-none p-0">
            {(access.allowedLabels ?? access.modules.map((m) => m.label)).map(
              (label) => (
                <li
                  key={label}
                  className="border border-border bg-background px-3 py-2 type-body-sm text-primary"
                >
                  ✓ {label}
                </li>
              ),
            )}
          </ul>
          <div className="mt-4 flex flex-wrap gap-2">
            {access.nav.map((m) => (
              <Link
                key={m.key}
                href={m.href}
                className="inline-flex h-10 items-center border border-primary bg-primary px-4 type-button text-text-inverse no-underline hover:bg-primary-hover"
              >
                Open {m.label}
              </Link>
            ))}
          </div>
        </div>

        {(access.restrictedLabels?.length ?? 0) > 0 ? (
          <div>
            <p className="type-caption uppercase tracking-[0.14em] text-accent">
              Restricted
            </p>
            <ul className="mt-3 grid gap-2 sm:grid-cols-2 list-none p-0">
              {access.restrictedLabels!.map((label) => (
                <li
                  key={label}
                  className="border border-border bg-surface-muted px-3 py-2 type-body-sm text-text-muted"
                >
                  • {label}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </section>
    </div>
  );
}
