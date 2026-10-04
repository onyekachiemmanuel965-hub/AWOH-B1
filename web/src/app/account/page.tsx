"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { StorefrontShell } from "@/components/layout/storefront-shell";
import { Container, Section } from "@/components/layout/primitives";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/feedback/feedback";
import { useAuth } from "@/components/auth/auth-provider";

export default function AccountPage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const [signingIn, setSigningIn] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login?next=/account");
    }
  }, [loading, user, router]);

  async function goToSignIn() {
    setSigningIn(true);
    try {
      await logout();
      router.push("/login");
    } finally {
      setSigningIn(false);
    }
  }

  return (
    <StorefrontShell atmosphere="stone">
        <Section className="!py-12 md:!py-16">
          <Container className="max-w-lg space-y-8">
            <div>
              <p className="type-caption uppercase tracking-[0.16em] text-accent">
                Account
              </p>
              <h1 className="mt-2 type-h1 text-primary">Your profile</h1>
              <p className="mt-3 type-body text-text-muted">
                Identity foundation for registered checkout. Order history and
                payments arrive in later stages.
              </p>
            </div>

            {loading || !user ? (
              <LoadingSpinner label="Loading account…" />
            ) : (
              <div className="space-y-6 border border-border bg-surface p-6">
                <dl className="space-y-4">
                  <div>
                    <dt className="type-caption text-text-muted">Name</dt>
                    <dd className="type-body text-primary">
                      {user.firstName} {user.lastName}
                    </dd>
                  </div>
                  <div>
                    <dt className="type-caption text-text-muted">Email</dt>
                    <dd className="type-body text-primary">{user.email}</dd>
                  </div>
                  <div>
                    <dt className="type-caption text-text-muted">Role</dt>
                    <dd className="type-body text-primary">{user.role}</dd>
                  </div>
                  <div>
                    <dt className="type-caption text-text-muted">Status</dt>
                    <dd className="type-body text-primary">{user.status}</dd>
                  </div>
                </dl>
                <div className="flex flex-wrap gap-3">
                  <Link
                    href="/"
                    className="inline-flex h-11 items-center justify-center rounded-md border border-primary bg-primary px-5 type-button text-text-inverse no-underline"
                  >
                    Back to storefront
                  </Link>
                  <Button
                    variant="outline"
                    onClick={goToSignIn}
                    loading={signingIn}
                  >
                    Sign in
                  </Button>
                </div>
              </div>
            )}
          </Container>
        </Section>
      </StorefrontShell>
  );
}
