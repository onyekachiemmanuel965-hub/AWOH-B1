import Link from "next/link";
import { StorefrontShell } from "@/components/layout/storefront-shell";
import { Container } from "@/components/layout/primitives";

export default function NotFound() {
  return (
    <StorefrontShell atmosphere="stone" mainClassName="py-20">
        <Container className="max-w-xl space-y-6 text-center">
          <p className="type-caption uppercase tracking-[0.16em] text-accent">
            Not found
          </p>
          <h1 className="type-h1 text-primary">We couldn&apos;t find that page</h1>
          <p className="type-body text-text-muted">
            The product or category may be unavailable, or the link may be out of
            date.
          </p>
          <Link
            href="/products"
            className="inline-flex h-11 items-center justify-center rounded-md border border-primary bg-primary px-5 type-button text-text-inverse no-underline"
          >
            Browse collections
          </Link>
        </Container>
      </StorefrontShell>
  );
}
