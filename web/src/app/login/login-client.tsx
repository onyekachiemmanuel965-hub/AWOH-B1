"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { StorefrontShell } from "@/components/layout/storefront-shell";
import { Container, Section } from "@/components/layout/primitives";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/auth/auth-provider";
import { useToast } from "@/components/feedback/toast";
import { resolvePostLoginPath } from "@/lib/post-login-path";

export default function LoginPage() {
  const { login, user, loading } = useAuth();
  const { push } = useToast();
  const router = useRouter();
  const params = useSearchParams();
  const nextParam = params.get("next");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      router.replace(resolvePostLoginPath(user.role, nextParam));
    }
  }, [loading, user, nextParam, router]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      const loggedIn = await login(email, password);
      push({ title: "Welcome back", tone: "success" });
      router.push(resolvePostLoginPath(loggedIn.role, nextParam));
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to sign in. Please try again.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <StorefrontShell atmosphere="marble">
        <Section className="!py-12 md:!py-16">
          <Container className="max-w-md">
            <p className="type-caption uppercase tracking-[0.16em] text-accent">
              Account
            </p>
            <h1 className="mt-2 type-h1 text-primary">Sign in</h1>
            <p className="mt-3 type-body text-text-muted">
              Customers are welcomed home after sign-in. Staff continue to the
              operations workspace. Account remains available anytime from the
              header.
            </p>

            <form className="mt-8 space-y-4" onSubmit={onSubmit} noValidate>
              <Input
                id="login-email"
                label="Email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <div className="space-y-1.5">
                <Input
                  id="login-password"
                  label="Password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="type-caption text-text-muted underline-offset-2 hover:underline"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-pressed={showPassword}
                >
                  {showPassword ? "Hide password" : "Show password"}
                </button>
              </div>
              {error ? (
                <p className="type-caption text-error" role="alert">
                  {error}
                </p>
              ) : null}
              <Button type="submit" className="w-full" loading={pending}>
                Sign in
              </Button>
            </form>

            <p className="mt-6 type-body-sm text-text-muted">
              New here?{" "}
              <Link
                href="/register"
                className="text-primary underline-offset-4 hover:underline"
              >
                Create an account
              </Link>
            </p>
          </Container>
        </Section>
      </StorefrontShell>
  );
}
