import Link from "next/link";
import { Container } from "@/components/layout/primitives";

export function BrandIntro() {
  return (
    <section
      id="about"
      aria-labelledby="brand-intro-heading"
      className="border-b border-border bg-background py-16 md:py-24"
    >
      <Container width="wide">
        <div className="grid items-end gap-10 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-7">
            <p className="mb-4 type-caption uppercase tracking-[0.16em] text-accent">
              The brand
            </p>
            <h2 id="brand-intro-heading" className="type-h1 text-primary">
              Materials with presence — chosen for spaces that last.
            </h2>
          </div>
          <div className="flex flex-col gap-6 lg:col-span-5">
            <p className="type-body-lg text-text-muted">
              AWOH-B THE GREAT TILES VENTURE is a premium architectural-materials
              partner helping homeowners, builders, contractors, architects, and
              businesses discover materials that bring quality and character to
              their spaces.
            </p>
            <p className="type-body text-text-muted">
              From considered surfaces to finishing details, we focus on clarity,
              craftsmanship, and a purchasing experience that respects how
              professionals and homeowners actually work.
            </p>
            <Link
              href="/about"
              className="type-label text-primary underline-offset-4 hover:underline"
            >
              About AWOH-B
            </Link>
          </div>
        </div>
      </Container>
    </section>
  );
}
