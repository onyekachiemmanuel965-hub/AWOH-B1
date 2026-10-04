import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { StorefrontShell } from "@/components/layout/storefront-shell";
import { Container, Section, Grid } from "@/components/layout/primitives";
import { ProductCard } from "@/components/product/product-card";
import { EmptyState } from "@/components/feedback/feedback";
import { createPageMetadata } from "@/lib/metadata";
import {
  fetchCategory,
  fetchProducts,
  formatProductPrice,
  mediaUrl,
} from "@/lib/api";

type Params = Promise<{ categorySlug: string }>;

export async function generateMetadata({ params }: { params: Params }) {
  const { categorySlug } = await params;
  try {
    const category = await fetchCategory(categorySlug);
    return createPageMetadata({
      title: category.name,
      description:
        category.description ??
        `${category.name} materials from AWOH-B THE GREAT TILES VENTURE.`,
      path: `/categories/${category.slug}`,
    });
  } catch {
    return createPageMetadata({
      title: "Category not found",
      path: `/categories/${categorySlug}`,
    });
  }
}

export default async function CategoryPage({ params }: { params: Params }) {
  const { categorySlug } = await params;
  let category;
  try {
    category = await fetchCategory(categorySlug);
  } catch {
    notFound();
  }

  const products = await fetchProducts({
    category: category.slug,
    limit: 24,
    sort: "newest",
  });

  return (
    <StorefrontShell atmosphere="porcelain">
        <Section className="border-b border-border bg-surface-muted !py-12">
          <Container width="wide" className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
            <div>
              <p className="type-caption uppercase tracking-[0.16em] text-accent">
                Category
              </p>
              <h1 className="mt-2 type-h1 text-primary">{category.name}</h1>
              {category.description ? (
                <p className="mt-4 max-w-2xl type-body text-text-muted">
                  {category.description}
                </p>
              ) : null}
            </div>
            {category.imageUrl ? (
              <div className="relative min-h-[12rem] overflow-hidden border border-border bg-surface">
                <Image
                  src={mediaUrl(category.imageUrl)}
                  alt=""
                  fill
                  unoptimized={category.imageUrl.endsWith(".svg")}
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 40vw"
                />
              </div>
            ) : null}
          </Container>
        </Section>

        <Section className="!py-10">
          <Container width="wide" className="space-y-10">
            <div>
              <h2 className="type-h3 text-primary">Products</h2>
              <p className="mt-1 type-body-sm text-text-muted">
                {products.meta.total} product
                {products.meta.total === 1 ? "" : "s"}
              </p>
              {products.data.length === 0 ? (
                <EmptyState
                  className="mt-6"
                  title="No products in this category yet"
                  description="Check back as the catalog grows, or browse all collections."
                  action={
                    <Link href="/products" className="type-label text-primary">
                      Browse collections
                    </Link>
                  }
                />
              ) : (
                <Grid cols={3} className="mt-6">
                  {products.data.map((product) => (
                    <ProductCard
                      key={product.id}
                      productId={product.id}
                      name={product.name}
                      category={product.category.name}
                      subcategory={product.subcategory.name}
                      priceLabel={formatProductPrice(product)}
                      imageSrc={mediaUrl(product.primaryImage) || undefined}
                      imageAlt={product.images[0]?.altText ?? product.name}
                      tileSize={product.tileSize}
                      tileSizeLabel={product.tileSizeLabel}
                      tileAspectRatio={product.tileAspectRatio}
                      availability={
                        product.availability === "AVAILABLE"
                          ? "available"
                          : "out-of-stock"
                      }
                      href={`/products/${product.slug}`}
                    />
                  ))}
                </Grid>
              )}
            </div>

            {category.subcategories.length > 0 ? (
              <div>
                <h2 className="type-h3 text-primary">Shop by size</h2>
                <ul className="mt-4 grid list-none gap-4 p-0 md:grid-cols-2 lg:grid-cols-3">
                  {category.subcategories.map((sub) => (
                    <li key={sub.id}>
                      <Link
                        href={`/categories/${category.slug}/${sub.slug}`}
                        className="group block overflow-hidden border border-border bg-surface no-underline transition-colors hover:border-primary"
                      >
                        {sub.imageUrl ? (
                          <div className="relative aspect-square w-full bg-surface-muted">
                            <Image
                              src={mediaUrl(sub.imageUrl)}
                              alt=""
                              fill
                              unoptimized={sub.imageUrl.endsWith(".svg")}
                              className="object-cover transition-transform duration-[var(--duration-slow)] ease-[var(--ease-out)] group-hover:scale-[1.03]"
                              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                            />
                          </div>
                        ) : null}
                        <div className="p-4">
                          <span className="type-h4 text-primary">{sub.name}</span>
                          {sub.description ? (
                            <p className="mt-1 type-body-sm text-text-muted">
                              {sub.description}
                            </p>
                          ) : null}
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </Container>
        </Section>
      </StorefrontShell>
  );
}
