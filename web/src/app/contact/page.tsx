import Link from "next/link";
import { SiteHeader } from "@/components/navigation/site-header";
import { SiteFooter } from "@/components/navigation/site-footer";
import { Container, Section } from "@/components/layout/primitives";
import { createPageMetadata, siteConfig } from "@/lib/metadata";
import { ContactForm } from "./contact-form";

export const metadata = createPageMetadata({
  title: "Contact",
  description:
    "Contact AWOH-B THE GREAT TILES VENTURE for product enquiries, orders, delivery discussions, or general assistance.",
  path: "/contact",
});

const linkPrimary =
  "inline-flex h-11 items-center justify-center rounded-md border border-primary bg-primary px-5 type-button text-text-inverse no-underline shadow-xs transition-colors hover:bg-primary-hover";
const linkSecondary =
  "inline-flex h-11 items-center justify-center rounded-md border border-border-strong bg-transparent px-5 type-button text-primary no-underline transition-colors hover:bg-surface-muted";

const contactFields = [
  { label: "Phone", value: "[PLACEHOLDER]" },
  { label: "Email", value: "[PLACEHOLDER]" },
  { label: "Showroom / location", value: "[PLACEHOLDER]" },
  { label: "Business hours", value: "[PLACEHOLDER]" },
  { label: "WhatsApp / other channel", value: "[PLACEHOLDER]" },
] as const;

export default function ContactPage() {
  return (
    <>
      <SiteHeader />
      <main id="main-content">
        <Section className="border-b border-border bg-surface-muted !py-14 md:!py-20">
          <Container width="wide">
            <p className="type-caption uppercase tracking-[0.16em] text-accent">
              Contact
            </p>
            <h1 className="mt-3 max-w-3xl type-h1 text-primary">
              Let&apos;s build something exceptional
            </h1>
            <p className="mt-5 max-w-2xl type-body-lg text-text-muted">
              Reach {siteConfig.shortName} for product enquiries, orders,
              delivery discussions, or general assistance. Confirmed business
              channels will appear here when provided — until then, placeholders
              mark what is still awaiting client details.
            </p>
          </Container>
        </Section>

        <Section className="!py-14 md:!py-20">
          <Container width="wide">
            <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
              <div className="lg:col-span-5">
                <h2 className="type-h2 text-primary">Contact information</h2>
                <p className="mt-3 type-body text-text-muted">
                  Do not treat placeholder values as live production contact
                  details.
                </p>
                <dl className="mt-8 space-y-5">
                  {contactFields.map((field) => (
                    <div
                      key={field.label}
                      className="border-t border-border pt-4"
                    >
                      <dt className="type-caption uppercase tracking-[0.12em] text-accent">
                        {field.label}
                      </dt>
                      <dd className="mt-1 type-body text-primary">
                        {field.value}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>

              <div className="lg:col-span-7">
                <h2 className="type-h2 text-primary">Enquiry</h2>
                <p className="mt-3 type-body text-text-muted">
                  Share a short note about your project or question. Message
                  delivery will be connected when the contact backend is ready.
                </p>
                <div className="mt-8">
                  <ContactForm />
                </div>
              </div>
            </div>
          </Container>
        </Section>

        <Section muted className="!py-14 md:!py-20">
          <Container>
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="type-h2 text-primary">Meanwhile</h2>
              <p className="mt-4 type-body text-text-muted">
                Browse the catalog, or return home while contact channels are
                confirmed.
              </p>
              <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
                <Link href="/products" className={linkPrimary}>
                  Browse products
                </Link>
                <Link href="/" className={linkSecondary}>
                  Return home
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
