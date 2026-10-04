"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { StorefrontShell } from "@/components/layout/storefront-shell";
import { Container, Section } from "@/components/layout/primitives";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/auth/auth-provider";
import { useToast } from "@/components/feedback/toast";
import { resolvePostLoginPath } from "@/lib/post-login-path";

export default function RegisterPage() {
  const { register, user, loading } = useAuth();
  const { push } = useToast();
  const router = useRouter();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      router.replace(resolvePostLoginPath(user.role));
    }
  }, [loading, user, router]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 8) {
      setError("Please choose a stronger password.");
      return;
    }
    setPending(true);
    try {
      const created = await register({ email, password, firstName, lastName });
      push({ title: "Account created", tone: "success" });
      router.push(resolvePostLoginPath(created.role));
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to complete registration.",
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
            <h1 className="mt-2 type-h1 text-primary">Create account</h1>
            <p className="mt-3 type-body text-text-muted">
              Registered checkout is the MVP path. Your account stays a customer
              account — roles are assigned by the server only.
            </p>

            <form className="mt-8 space-y-4" onSubmit={onSubmit} noValidate>
              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  id="reg-first"
                  label="First name"
                  autoComplete="given-name"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
                <Input
                  id="reg-last"
                  label="Last name"
                  autoComplete="family-name"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
              </div>
              <Input
                id="reg-email"
                label="Email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <div className="space-y-1.5">
                <Input
                  id="reg-password"
                  label="Password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  hint="At least 8 characters with letters and numbers."
                />
                <Input
                  id="reg-confirm"
                  label="Confirm password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                />
                <button
                  type="button"
                  className="type-caption text-text-muted underline-offset-2 hover:underline"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-pressed={showPassword}
                >
                  {showPassword ? "Hide passwords" : "Show passwords"}
                </button>
              </div>
              {error ? (
                <p className="type-caption text-error" role="alert">
                  {error}
                </p>
              ) : null}
              <Button type="submit" className="w-full" loading={pending}>
                Create account
              </Button>
            </form>

            <p className="mt-6 type-body-sm text-text-muted">
              Already registered?{" "}
              <Link href="/login" className="text-primary underline-offset-4 hover:underline">
                Sign in
              </Link>
            </p>
          </Container>
        </Section>
      </StorefrontShell>
  );
}
