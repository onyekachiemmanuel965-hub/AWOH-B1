"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { StorefrontShell } from "@/components/layout/storefront-shell";
import { Container, Section } from "@/components/layout/primitives";
import { LoadingSpinner } from "@/components/feedback/feedback";
import { useAuth } from "@/components/auth/auth-provider";
import { isStaffRole } from "@/lib/admin-api";
import { siteConfig } from "@/lib/metadata";

/** Brief pause so the welcome reads as intentional — cleaned up on unmount. */
const AUTO_HOME_MS = 3200;

export function WelcomeClient() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (isStaffRole(user.role)) {
      router.replace("/admin");
      return;
    }

    const timer = window.setTimeout(() => {
      router.replace("/");
    }, AUTO_HOME_MS);

    return () => window.clearTimeout(timer);
  }, [loading, user, router]);

  if (loading || !user || isStaffRole(user.role)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <LoadingSpinner label="Preparing your welcome…" />
      </div>
    );
  }

  const firstName = user.firstName?.trim();

  return (
    <StorefrontShell atmosphere="interior">
        <Section className="!py-16 md:!py-24">
          <Container className="max-w-xl text-center">
            <p className="type-caption uppercase tracking-[0.16em] text-accent">
              Welcome
            </p>
            <h1 className="mt-3 type-h1 text-primary">
              Welcome to {siteConfig.shortName}
            </h1>
            <p className="mt-4 type-body-lg text-primary">
              You&apos;re successfully signed in
              {firstName ? `, ${firstName}` : ""}.
            </p>
            <p className="mt-4 type-body text-text-muted">
              We&apos;re glad to have you with us. Explore our collection of
              premium architectural materials and find the right finish for your
              space.
            </p>
            <div className="mt-10 flex flex-col items-stretch gap-3 sm:items-center">
              <Link
                href="/"
                className="inline-flex h-11 items-center justify-center rounded-md border border-primary bg-primary px-6 type-button text-text-inverse no-underline shadow-xs transition-colors hover:bg-primary-hover"
              >
                Continue to {siteConfig.shortName}
              </Link>
              <Link
                href="/products"
                className="type-label text-text-muted no-underline underline-offset-4 hover:text-primary hover:underline"
              >
                Continue shopping
              </Link>
            </div>
            <p className="mt-8 type-caption text-text-muted">
              You will be taken to the home page shortly.
            </p>
          </Container>
        </Section>
      </StorefrontShell>
  );
}
