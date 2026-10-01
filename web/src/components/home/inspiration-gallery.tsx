import Image from "next/image";
import { Container } from "@/components/layout/primitives";
import { inspirationItems } from "@/lib/home-content";
import { mediaUrl, type StorefrontImage } from "@/lib/api";
import { cn } from "@/lib/cn";

const INSPIRE_KEYS = [
  "home.inspire.1",
  "home.inspire.2",
  "home.inspire.3",
  "home.inspire.4",
] as const;

/**
 * Editorial inspiration gallery — imagery can be replaced via CMS.
 */
export function InspirationGallery({
  images = [],
}: {
  images?: StorefrontImage[];
}) {
  const byKey = new Map(images.map((i) => [i.key, i]));

  return (
    <section
      aria-labelledby="inspiration-heading"
      className="bg-background py-16 md:py-24"
    >
      <Container width="wide">
        <div className="mb-10 max-w-2xl space-y-3 md:mb-14">
          <p className="type-caption uppercase tracking-[0.16em] text-accent">
            Inspiration
          </p>
          <h2 id="inspiration-heading" className="type-h2 text-primary">
            How materials shape a room
          </h2>
          <p className="type-body text-text-muted">
            An editorial look at atmosphere, detail, and light. Upload approved
            photography in CMS to replace placeholders.
          </p>
        </div>

        <div className="grid auto-rows-[12rem] gap-3 sm:auto-rows-[14rem] sm:grid-cols-2 lg:auto-rows-[16rem] lg:grid-cols-6 lg:gap-4">
          {inspirationItems.map((item, index) => {
            const cms = byKey.get(INSPIRE_KEYS[index]);
            const src = mediaUrl(cms?.url ?? item.imageSrc);
            const alt = cms?.altText ?? item.imageAlt;
            return (
              <figure
                key={item.id}
                className={cn(
                  "group relative overflow-hidden border border-border bg-surface-muted",
                  item.span === "wide" &&
                    "sm:col-span-2 lg:col-span-4 lg:row-span-2",
                  item.span === "tall" && "lg:col-span-2 lg:row-span-2",
                  item.span === "standard" && "lg:col-span-2",
                )}
              >
                <Image
                  src={src}
                  alt={alt}
                  fill
                  unoptimized
                  loading="lazy"
                  className="object-cover transition-transform duration-[var(--duration-slow)] ease-[var(--ease-out)] group-hover:scale-[1.02]"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
                <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-primary/80 to-transparent p-4 pt-12 text-text-inverse sm:p-5">
                  <p className="font-brand-display text-xl sm:text-2xl">
                    {item.title}
                  </p>
                  <p className="mt-1 type-caption text-text-inverse/75">
                    {item.caption}
                  </p>
                </figcaption>
              </figure>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
