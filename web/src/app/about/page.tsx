import Link from "next/link";
import { SiteHeader } from "@/components/navigation/site-header";
import { SiteFooter } from "@/components/navigation/site-footer";
import { Container, Section } from "@/components/layout/primitives";
import { PageImageBanner } from "@/components/content/page-image-banner";
import { createPageMetadata, siteConfig } from "@/lib/metadata";
import { whyPoints } from "@/lib/home-content";
import { fetchStorefrontImages, storefrontImageMap } from "@/lib/api";

export const metadata = createPageMetadata({
  title: "About",
  description:
    "Learn about AWOH-B THE GREAT TILES VENTURE — premium architectural tiles and finishing materials for considered spaces.",
  path: "/about",
});

const linkPrimary =
  "inline-flex h-11 items-center justify-center rounded-md border border-primary bg-primary px-5 type-button text-text-inverse no-underline shadow-xs transition-colors hover:bg-primary-hover";
const linkSecondary =
  "inline-flex h-11 items-center justify-center rounded-md border border-border-strong bg-transparent px-5 type-button text-primary no-underline transition-colors hover:bg-surface-muted";

export default async function AboutPage() {
  const images = await fetchStorefrontImages("about");
  const banner = storefrontImageMap(images).get("about.hero");

  return (
    <>
      <SiteHeader />
      <main id="main-content">
        {banner?.isCustom ? (
          <PageImageBanner src={banner.url} alt={banner.altText} />
        ) : null}
        <Section className="border-b border-border bg-surface-muted !py-14 md:!py-20">
          <Container width="wide">
            <p className="type-caption uppercase tracking-[0.16em] text-accent">
              About
            </p>
            <h1 className="mt-3 max-w-3xl type-h1 text-primary">
              Materials with presence — chosen for spaces that last.
            </h1>
            <p className="mt-5 max-w-2xl type-body-lg text-text-muted">
              {siteConfig.name} is a premium architectural-materials partner
              helping homeowners, builders, contractors, architects, and
              businesses discover materials that bring quality and character to
              their spaces.
            </p>
          </Container>
        </Section>

        <Section className="!py-14 md:!py-20">
          <Container width="wide">
            <div className="grid gap-10 lg:grid-cols-12 lg:gap-16">
              <div className="lg:col-span-5">
                <p className="type-caption uppercase tracking-[0.16em] text-accent">
                  Who we are
                </p>
                <h2 className="mt-3 type-h2 text-primary">
                  An architectural-materials focus
                </h2>
              </div>
              <div className="flex flex-col gap-5 lg:col-span-7">
                <p className="type-body text-text-muted">
                  From considered surfaces to finishing details, we focus on
                  clarity, craftsmanship, and a purchasing experience that
                  respects how professionals and homeowners actually work.
                </p>
                <p className="type-body text-text-muted">
                  Our catalog emphasizes premium tiles and related finishing
                  materials — selected for quality, lasting visual character, and
                  practical use across interiors and exteriors.
                </p>
              </div>
            </div>
          </Container>
        </Section>

        <Section muted className="!py-14 md:!py-20">
          <Container width="wide">
            <p className="type-caption uppercase tracking-[0.16em] text-accent">
              What we stand for
            </p>
            <h2 className="mt-3 max-w-2xl type-h2 text-primary">
              Quality, clarity, and professional service
            </h2>
            <ul className="mt-10 grid list-none gap-8 p-0 sm:grid-cols-2">
              {whyPoints.map((point) => (
                <li
                  key={point.title}
                  className="border-t border-border pt-5"
                >
                  <h3 className="font-brand-display text-2xl text-primary">
                    {point.title}
                  </h3>
                  <p className="mt-2 type-body-sm text-text-muted">
                    {point.body}
                  </p>
                </li>
              ))}
            </ul>
          </Container>
        </Section>

        <Section className="!py-14 md:!py-20">
          <Container>
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="type-h2 text-primary">Explore the collection</h2>
              <p className="mt-4 type-body text-text-muted">
                Browse products by material character, or reach out when you are
                ready to discuss a project.
              </p>
              <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
                <Link href="/products" className={linkPrimary}>
                  Browse products
                </Link>
                <Link href="/contact" className={linkSecondary}>
                  Contact
                </Link>
              </div>
            </div>
          </Container>
        </Section>
      </main>
      <SiteFooter />
    </>
  );
}
