import Link from "next/link";
import { BrandMark } from "@/components/navigation/brand-mark";
import { Container } from "@/components/layout/primitives";
import { cn } from "@/lib/cn";

const footerNav = [
  {
    title: "Shop",
    links: [
      { label: "Home", href: "/" },
      { label: "Products", href: "/products" },
      { label: "Categories", href: "/categories" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Contact", href: "/contact" },
    ],
  },
  {
    title: "Customer",
    links: [
      { label: "Cart", href: "/cart" },
      { label: "Account", href: "/account" },
      { label: "Contact / Help", href: "/contact" },
    ],
  },
];

/**
 * Premium public footer — contact details remain placeholders until provided.
 */
export function SiteFooter({ className }: { className?: string }) {
  const year = new Date().getFullYear();

  return (
    <footer
      className={cn(
        "border-t border-border bg-primary text-text-inverse",
        className,
      )}
    >
      <Container width="wide" className="py-14">
        <div className="grid gap-10 md:grid-cols-[1.5fr_repeat(3,1fr)]">
          <div className="flex flex-col gap-4">
            <BrandMark inverse />
            <p className="max-w-sm type-body-sm text-text-inverse/75">
              Premium architectural tiles and finishing materials for spaces that
              demand quality, character, and lasting appeal.
            </p>
            <div className="type-caption text-text-inverse/55">
              <p>Phone: [PLACEHOLDER]</p>
              <p>Email: [PLACEHOLDER]</p>
              <p>Address: [PLACEHOLDER]</p>
              <p>Social: [PLACEHOLDER]</p>
            </div>
          </div>

          {footerNav.map((group) => (
            <div key={group.title} className="flex flex-col gap-3">
              <p className="type-label uppercase tracking-[0.1em] text-accent">
                {group.title}
              </p>
              <ul className="flex flex-col gap-2">
                {group.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="type-body-sm text-text-inverse/80 no-underline hover:text-text-inverse"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col gap-2 border-t border-white/10 pt-6 type-caption text-text-inverse/55 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} AWOH-B THE GREAT TILES VENTURE. All rights reserved.
          </p>
          <p>Business registration: [PLACEHOLDER]</p>
        </div>
      </Container>
    </footer>
  );
}
