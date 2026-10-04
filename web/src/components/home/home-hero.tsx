import Image from "next/image";
import Link from "next/link";
import { Container } from "@/components/layout/primitives";
import { mediaUrl } from "@/lib/api";

const ctaPrimary =
  "inline-flex h-11 items-center justify-center rounded-md border border-primary bg-primary px-5 type-button text-text-inverse no-underline shadow-xs transition-colors hover:bg-primary-hover";
const ctaSecondary =
  "inline-flex h-11 items-center justify-center rounded-md border border-border-strong bg-surface/90 px-5 type-button text-primary no-underline transition-colors hover:bg-surface";

const FALLBACK_SRC = "/images/placeholders/hero-surface.svg";
const FALLBACK_ALT =
  "Architectural surface placeholder representing premium tile materials";

/**
 * Full-bleed premium hero — brand-forward, single composition.
 * Image comes from storefront CMS (`home.hero`) with placeholder fallback.
 */
export function HomeHero({
  imageSrc = FALLBACK_SRC,
  imageAlt = FALLBACK_ALT,
}: {
  imageSrc?: string;
  imageAlt?: string;
}) {
  const src = mediaUrl(imageSrc) || FALLBACK_SRC;

  return (
    <section
      aria-labelledby="hero-heading"
      className="relative isolate min-h-[min(92dvh,52rem)] overflow-hidden bg-primary"
    >
      <div className="absolute inset-0">
        <Image
          src={src}
          alt={imageAlt}
          fill
          priority
          unoptimized
          className="object-cover object-center opacity-95"
          sizes="100vw"
        />
        <div
          className="absolute inset-0 bg-gradient-to-r from-background via-background/88 to-background/25"
          aria-hidden
        />
      </div>

      <Container
        width="wide"
        className="relative flex min-h-[min(92dvh,52rem)] flex-col justify-end pb-14 pt-28 sm:justify-center sm:pb-20 sm:pt-24"
      >
        <div className="motion-fade-in max-w-xl space-y-6 sm:max-w-2xl">
          <p className="type-caption uppercase tracking-[0.12em] text-accent sm:tracking-[0.18em]">
            AWOH-B THE GREAT TILES VENTURE
          </p>
          <h1 id="hero-heading" className="type-display text-primary">
            Define Your Space.
          </h1>
          <p className="max-w-lg type-body-lg text-text-muted">
            Premium tiles and architectural finishing materials selected for
            spaces that demand quality, character, and lasting appeal.
          </p>
          <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:flex-wrap sm:items-center">
            <Link href="/products" className={ctaPrimary}>
              Explore Collections
            </Link>
            <Link href="#contact" className={ctaSecondary}>
              Contact AWOH-B
            </Link>
          </div>
        </div>
      </Container>
    </section>
  );
}
