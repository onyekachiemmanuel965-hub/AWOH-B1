import Image from "next/image";
import Link from "next/link";
import { SiteHeader } from "@/components/navigation/site-header";
import { SiteFooter } from "@/components/navigation/site-footer";
import { Container, Section } from "@/components/layout/primitives";
import { EmptyState, ErrorState } from "@/components/feedback/feedback";
import { createPageMetadata } from "@/lib/metadata";
import { fetchCategories, type PublicCategory } from "@/lib/api";
import { cn } from "@/lib/cn";

export const metadata = createPageMetadata({
  title: "Categories",
  description:
    "Explore AWOH-B product categories — premium architectural tiles and finishing materials by material character.",
  path: "/categories",
});

export default async function CategoriesPage() {
  let categories: PublicCategory[] = [];
  let error: string | null = null;

  try {
    categories = await fetchCategories();
  } catch {
    error = "Unable to load categories right now. Please try again shortly.";
  }

  return (
    <>
      <SiteHeader />
      <main id="main-content">
        <Section className="border-b border-border bg-surface-muted !py-12 md:!py-16">
          <Container width="wide">
            <p className="type-caption uppercase tracking-[0.16em] text-accent">
              Catalog
            </p>
            <h1 className="mt-2 type-h1 text-primary">Categories</h1>
            <p className="mt-3 max-w-2xl type-body text-text-muted">
              Discover collections by material character. Categories come from
              the live catalog — each leads into the existing category and
              product routes.
            </p>
          </Container>
        </Section>

        <Section className="!py-12 md:!py-16">
          <Container width="wide">
            {error ? (
              <ErrorState title="Categories unavailable" description={error} />
            ) : categories.length === 0 ? (
              <EmptyState
                title="No categories yet"
                description="Seed the development catalog to preview category discovery."
              />
            ) : (
              <ul className="grid list-none gap-5 p-0 sm:grid-cols-2 lg:grid-cols-3">
                {categories.map((cat) => (
                  <li key={cat.id}>
                    <CategoryCard category={cat} />
                  </li>
                ))}
              </ul>
            )}
          </Container>
        </Section>
      </main>
      <SiteFooter />
    </>
  );
}

function CategoryCard({ category }: { category: PublicCategory }) {
  const imageSrc =
    category.imageUrl ?? "/images/placeholders/category-tiles.svg";
  const href = `/categories/${category.slug}`;

  return (
    <Link
      href={href}
      className={cn(
        "group relative flex min-h-[18rem] flex-col overflow-hidden border border-border bg-surface no-underline",
      )}
    >
      <div className="relative min-h-[12rem] flex-1">
        <Image
          src={imageSrc}
          alt=""
          fill
          unoptimized={imageSrc.endsWith(".svg")}
          className="object-cover transition-transform duration-[var(--duration-slow)] ease-[var(--ease-out)] group-hover:scale-[1.03]"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
        <div
          className="absolute inset-0 bg-gradient-to-t from-primary/75 via-primary/15 to-transparent"
          aria-hidden
        />
      </div>
      <div className="absolute inset-x-0 bottom-0 p-5">
        <h2 className="font-brand-display text-2xl text-text-inverse">
          {category.name}
        </h2>
        <p className="mt-1 line-clamp-2 type-body-sm text-text-inverse/80">
          {category.description ?? "Explore this collection"}
        </p>
        {category.subcategories.length > 0 ? (
          <p className="mt-2 type-caption text-accent">
            {category.subcategories.length} subcategor
            {category.subcategories.length === 1 ? "y" : "ies"}
          </p>
        ) : (
          <span className="mt-2 inline-block type-caption uppercase tracking-[0.12em] text-accent">
            View collection
          </span>
        )}
      </div>
    </Link>
  );
}
