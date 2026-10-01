import Link from "next/link";
import { Suspense } from "react";
import { SiteHeader } from "@/components/navigation/site-header";
import { SiteFooter } from "@/components/navigation/site-footer";
import { Container, Section, Grid } from "@/components/layout/primitives";
import { ProductCard } from "@/components/product/product-card";
import { CatalogFilters } from "@/components/catalog/catalog-filters";
import { EmptyState, ErrorState, Skeleton } from "@/components/feedback/feedback";
import { createPageMetadata } from "@/lib/metadata";
import {
  fetchCategories,
  fetchProducts,
  fetchStorefrontImages,
  formatProductPrice,
  mediaUrl,
  storefrontImageMap,
  type ProductListResponse,
  type PublicCategory,
} from "@/lib/api";
import { PageImageBanner } from "@/components/content/page-image-banner";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export async function generateMetadata({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q : undefined;
  const base = createPageMetadata({
    title: q ? `Search: ${q}` : "Collections",
    description:
      "Browse premium architectural tiles and materials from AWOH-B THE GREAT TILES VENTURE.",
    path: "/products",
  });
  if (q) {
    return { ...base, robots: { index: false, follow: true } };
  }
  return base;
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q : undefined;
  const category = typeof sp.category === "string" ? sp.category : undefined;
  const subcategory =
    typeof sp.subcategory === "string" ? sp.subcategory : undefined;
  const sort = typeof sp.sort === "string" ? sp.sort : "newest";
  const page = Number(typeof sp.page === "string" ? sp.page : "1") || 1;

  let categories: PublicCategory[] = [];
  let productsResult: ProductListResponse | null = null;
  let error: string | null = null;
  let pageBanner: { url: string; altText: string } | null = null;

  try {
    const [cats, products, storefront] = await Promise.all([
      fetchCategories(),
      fetchProducts({
        q,
        category,
        subcategory,
        sort,
        page,
        limit: 12,
      }),
      fetchStorefrontImages("products"),
    ]);
    categories = cats;
    productsResult = products;
    const banner = storefrontImageMap(storefront).get("products.hero");
    if (banner?.isCustom) {
      pageBanner = { url: banner.url, altText: banner.altText };
    }
  } catch {
    error = "Unable to load the catalog right now. Please try again shortly.";
  }

  return (
    <>
      <SiteHeader />
      <main id="main-content">
        {pageBanner ? (
          <PageImageBanner src={pageBanner.url} alt={pageBanner.altText} />
        ) : null}
        <Section className="border-b border-border bg-surface-muted !py-12">
          <Container width="wide">
            <p className="type-caption uppercase tracking-[0.16em] text-accent">
              Catalog
            </p>
            <h1 className="mt-2 type-h1 text-primary">Collections</h1>
            <p className="mt-3 max-w-2xl type-body text-text-muted">
              Explore materials by category and subcategory. Prices and
              availability come from the AWOH-B catalog service.
            </p>
          </Container>
        </Section>

        <Section className="!py-10">
          <Container width="wide" className="space-y-8">
            <Suspense fallback={<Skeleton className="h-40 w-full" />}>
              <CatalogFilters categories={categories} />
            </Suspense>

            {error ? (
              <ErrorState title="Catalog unavailable" description={error} />
            ) : !productsResult ? (
              <Skeleton className="h-64 w-full" />
            ) : productsResult.data.length === 0 ? (
              <EmptyState
                title={q ? `No results for “${q}”` : "No products found"}
                description="Try another search or clear filters to browse the full collection."
                action={
                  <Link
                    href="/products"
                    className="type-label text-primary underline-offset-4 hover:underline"
                  >
                    Clear filters
                  </Link>
                }
              />
            ) : (
              <>
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <p className="type-body-sm text-text-muted">
                    {q ? (
                      <>
                        Search results for <strong>“{q}”</strong> ·{" "}
                      </>
                    ) : null}
                    {productsResult.meta.total} product
                    {productsResult.meta.total === 1 ? "" : "s"}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {categories.slice(0, 6).map((cat) => (
                      <Link
                        key={cat.id}
                        href={`/categories/${cat.slug}`}
                        className="rounded-sm border border-border px-3 py-1 type-caption text-text no-underline hover:border-primary"
                      >
                        {cat.name}
                      </Link>
                    ))}
                  </div>
                </div>

                <Grid cols={3}>
                  {productsResult.data.map((product) => (
                    <ProductCard
                      key={product.id}
                      productId={product.id}
                      name={product.name}
                      category={product.category.name}
                      subcategory={product.subcategory.name}
                      priceLabel={formatProductPrice(product)}
                      imageSrc={mediaUrl(product.primaryImage) || undefined}
                      imageAlt={
                        product.images[0]?.altText ?? product.name
                      }
                      tileSize={product.tileSize}
                      tileSizeLabel={product.tileSizeLabel}
                      tileAspectRatio={product.tileAspectRatio}
                      availability={
                        product.availability === "AVAILABLE"
                          ? "available"
                          : "out-of-stock"
                      }
                      href={`/products/${product.slug}`}
                      quickActionLabel="View"
                    />
                  ))}
                </Grid>

                {productsResult.meta.pageCount > 1 ? (
                  <nav
                    className="flex items-center justify-center gap-3 pt-4"
                    aria-label="Pagination"
                  >
                    {page > 1 ? (
                      <Link
                        href={`/products?${new URLSearchParams({
                          ...(q ? { q } : {}),
                          ...(category ? { category } : {}),
                          ...(subcategory ? { subcategory } : {}),
                          sort,
                          page: String(page - 1),
                        }).toString()}`}
                        className="type-label text-primary underline-offset-4 hover:underline"
                      >
                        Previous
                      </Link>
                    ) : null}
                    <span className="type-caption text-text-muted">
                      Page {productsResult.meta.page} of{" "}
                      {productsResult.meta.pageCount}
                    </span>
                    {page < productsResult.meta.pageCount ? (
                      <Link
                        href={`/products?${new URLSearchParams({
                          ...(q ? { q } : {}),
                          ...(category ? { category } : {}),
                          ...(subcategory ? { subcategory } : {}),
                          sort,
                          page: String(page + 1),
                        }).toString()}`}
                        className="type-label text-primary underline-offset-4 hover:underline"
                      >
                        Next
                      </Link>
                    ) : null}
                  </nav>
                ) : null}
              </>
            )}
          </Container>
        </Section>
      </main>
      <SiteFooter />
    </>
  );
}
