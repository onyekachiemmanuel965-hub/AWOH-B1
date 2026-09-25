import Link from "next/link";
import { Container } from "@/components/layout/primitives";

const ctaPrimary =
  "inline-flex h-11 items-center justify-center rounded-md border border-primary bg-primary px-5 type-button text-text-inverse no-underline shadow-xs transition-colors hover:bg-primary-hover";
const ctaSecondary =
  "inline-flex h-11 items-center justify-center rounded-md border border-border-strong bg-transparent px-5 type-button text-primary no-underline transition-colors hover:bg-surface-muted";

export function HomeCta() {
  return (
    <section
      id="contact"
      aria-labelledby="cta-heading"
      className="border-y border-border bg-surface-muted py-16 md:py-24"
    >
      <Container>
        <div className="mx-auto max-w-3xl text-center">
          <p className="mb-4 type-caption uppercase tracking-[0.16em] text-accent">
            Next step
          </p>
          <h2 id="cta-heading" className="type-h1 text-primary">
            Let&apos;s build a space worth remembering.
          </h2>
          <p className="mx-auto mt-5 max-w-xl type-body-lg text-text-muted">
            Explore the collections, or reach out to discuss materials for your
            next home, project, or development. Contact details will appear here
            once confirmed — until then, use the channels AWOH-B provides
            directly.
          </p>
          <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
            <Link href="/products" className={ctaPrimary}>
              Explore Collections
            </Link>
            <Link href="/contact" className={ctaSecondary}>
              Contact AWOH-B
            </Link>
          </div>
          <p className="mt-8 type-caption text-text-muted">
            Phone / email / address: [PLACEHOLDER — awaiting client details]
          </p>
        </div>
      </Container>
    </section>
  );
}
