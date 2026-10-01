import Image from "next/image";
import Link from "next/link";
import { Container } from "@/components/layout/primitives";
import { fetchCategories, mediaUrl, type PublicCategory } from "@/lib/api";
import { cn } from "@/lib/cn";
import { EmptyState } from "@/components/feedback/feedback";

/**
 * Category discovery from live catalog API.
 */
export async function CategoryDiscovery() {
  let categories: PublicCategory[] = [];
  try {
    categories = await fetchCategories();
  } catch {
    return (
      <section id="collections" className="bg-surface-muted py-16 md:py-24">
        <Container width="wide">
          <EmptyState
            title="Collections unavailable"
            description="Start the AWOH-B API to load categories."
          />
        </Container>
      </section>
    );
  }

  if (categories.length === 0) {
    return (
      <section id="collections" className="bg-surface-muted py-16 md:py-24">
        <Container width="wide">
          <EmptyState
            title="No categories yet"
            description="Seed the development catalog to preview category discovery."
          />
        </Container>
      </section>
    );
  }

  const [primary, ...rest] = categories;

  return (
    <section
      id="collections"
      aria-labelledby="collections-heading"
      className="bg-surface-muted py-16 md:py-24"
    >
      <Container width="wide">
        <div className="mb-10 flex flex-col gap-3 md:mb-14 md:max-w-2xl">
          <p className="type-caption uppercase tracking-[0.16em] text-accent">
            Collections
          </p>
          <h2 id="collections-heading" className="type-h2 text-primary">
            Discover by material character
          </h2>
          <p className="type-body text-text-muted">
            Categories and subcategories are loaded from the catalog service —
            expandable without hard-coded UI taxonomies.
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-12 lg:gap-5">
          <CategoryTile
            href={`/categories/${primary.slug}`}
            name={primary.name}
            phrase={primary.description ?? "Explore this collection"}
            imageSrc={mediaUrl(
              primary.imageUrl ?? "/images/placeholders/category-tiles.svg",
            )}
            className="min-h-[22rem] lg:col-span-7 lg:min-h-[36rem]"
            priority
          />
          <ul className="grid list-none gap-4 p-0 sm:grid-cols-3 lg:col-span-5 lg:grid-cols-1 lg:gap-5">
            {rest.map((cat) => (
              <li key={cat.id}>
                <CategoryTile
                  href={`/categories/${cat.slug}`}
                  name={cat.name}
                  phrase={cat.description ?? "Explore this collection"}
                  imageSrc={mediaUrl(
                    cat.imageUrl ??
                      "/images/placeholders/category-surfaces.svg",
                  )}
                  className="min-h-[14rem] lg:min-h-[calc((36rem-2.5rem)/3)]"
                />
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </section>
  );
}

function CategoryTile({
  href,
  name,
  phrase,
  imageSrc,
  className,
  priority,
}: {
  href: string;
  name: string;
  phrase: string;
  imageSrc: string;
  className?: string;
  priority?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group relative block overflow-hidden border border-border bg-surface no-underline",
        className,
      )}
    >
      <Image
        src={imageSrc}
        alt=""
        fill
        priority={priority}
        unoptimized={imageSrc.endsWith(".svg")}
        className="object-cover transition-transform duration-[var(--duration-slow)] ease-[var(--ease-out)] group-hover:scale-[1.03]"
        sizes="(max-width: 1024px) 100vw, 60vw"
      />
      <div
        className="absolute inset-0 bg-gradient-to-t from-primary/80 via-primary/20 to-transparent"
        aria-hidden
      />
      <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6">
        <h3 className="font-brand-display text-2xl text-text-inverse sm:text-3xl">
          {name}
        </h3>
        <p className="mt-1 line-clamp-2 type-body-sm text-text-inverse/80">
          {phrase}
        </p>
        <span className="mt-3 inline-block type-caption uppercase tracking-[0.12em] text-accent">
          View collection
        </span>
      </div>
    </Link>
  );
}
