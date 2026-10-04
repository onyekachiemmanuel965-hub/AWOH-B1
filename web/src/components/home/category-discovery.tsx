import Link from "next/link";
import { Container, Grid } from "@/components/layout/primitives";
import { ProductCard } from "@/components/product/product-card";
import { EmptyState } from "@/components/feedback/feedback";
import {
  fetchCategories,
  fetchProducts,
  formatProductPrice,
  mediaUrl,
  type PublicProduct,
} from "@/lib/api";

const SHOWCASE_COUNT = 10;

/**
 * Homepage product showcase — ~10 different live catalog products.
 * Replaces the large category-tile mosaic on the landing page.
 */
export async function CategoryDiscovery() {
  let products: PublicProduct[] = [];
  let error = false;

  try {
    products = await loadShowcaseProducts(SHOWCASE_COUNT);
  } catch {
    error = true;
  }

  return (
    <section
      id="collections"
      aria-labelledby="collections-heading"
      className="bg-surface-muted py-16 md:py-24"
    >
      <Container width="wide">
        <div className="mb-10 flex flex-col justify-between gap-4 md:mb-12 md:flex-row md:items-end">
          <div className="max-w-2xl space-y-3">
            <p className="type-caption uppercase tracking-[0.16em] text-accent">
              Selected materials
            </p>
            <h2 id="collections-heading" className="type-h2 text-primary">
              Ten surfaces from the collection
            </h2>
            <p className="type-body text-text-muted">
              A curated set of individual tiles from the live catalog — browse
              each piece, then explore the full assortment when you are ready.
            </p>
          </div>
          <Link
            href="/products"
            className="type-label shrink-0 text-primary underline-offset-4 hover:underline"
          >
            View all products
          </Link>
        </div>

        {error ? (
          <EmptyState
            title="Products unavailable"
            description="Start the AWOH-B API to load catalog products."
          />
        ) : products.length === 0 ? (
          <EmptyState
            title="No products yet"
            description="Load the catalog to preview materials on the storefront."
          />
        ) : (
          <Grid cols={4}>
            {products.map((product) => (
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
      </Container>
    </section>
  );
}

/** Pull a few products from several categories so the homepage mix looks varied. */
async function loadShowcaseProducts(count: number) {
  const categories = await fetchCategories();
  const catalogCategories = categories.filter(
    (c) =>
      !c.slug.startsWith("smoke-") &&
      c.slug !== "tiles" &&
      c.slug !== "architectural-surfaces" &&
      c.slug !== "finishing-materials",
  );

  const perCategory = Math.max(
    1,
    Math.ceil(count / Math.max(catalogCategories.length, 1)),
  );

  const batches = await Promise.all(
    catalogCategories.map((category) =>
      fetchProducts({
        category: category.slug,
        limit: perCategory,
        sort: "newest",
      })
        .then((r) => r.data)
        .catch(() => [] as PublicProduct[]),
    ),
  );

  const queues = batches.filter((b) => b.length > 0);
  const picked: PublicProduct[] = [];
  let index = 0;

  while (picked.length < count && queues.some((q) => q.length > 0)) {
    const queue = queues[index % queues.length];
    index += 1;
    const next = queue.shift();
    if (next) picked.push(next);
  }

  if (picked.length < count) {
    const fallback = await fetchProducts({ limit: count, sort: "newest" });
    for (const product of fallback.data) {
      if (picked.length >= count) break;
      if (picked.some((p) => p.id === product.id)) continue;
      picked.push(product);
    }
  }

  return picked;
}
