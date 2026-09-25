import Link from "next/link";
import { Container, Grid } from "@/components/layout/primitives";
import { ProductCard } from "@/components/product/product-card";
import {
  fetchProducts,
  formatProductPrice,
  type PublicProduct,
} from "@/lib/api";
import { EmptyState } from "@/components/feedback/feedback";

/**
 * Featured showcase from live catalog API (featured flag).
 */
export async function FeaturedCollection() {
  let products: PublicProduct[] = [];
  let error = false;
  try {
    const result = await fetchProducts({ featured: true, limit: 3, sort: "newest" });
    products = result.data;
  } catch {
    error = true;
  }

  return (
    <section
      aria-labelledby="featured-heading"
      className="border-b border-border bg-background py-16 md:py-24"
    >
      <Container width="wide">
        <div className="mb-10 flex flex-col justify-between gap-4 md:mb-12 md:flex-row md:items-end">
          <div className="max-w-xl space-y-3">
            <p className="type-caption uppercase tracking-[0.16em] text-accent">
              Featured
            </p>
            <h2 id="featured-heading" className="type-h2 text-primary">
              A glimpse of the collection
            </h2>
            <p className="type-body text-text-muted">
              Featured materials from the live catalog. Development seed data is
              labeled as demo until the real AWOH-B assortment is loaded.
            </p>
          </div>
          <Link
            href="/products"
            className="type-label shrink-0 text-primary underline-offset-4 hover:underline"
          >
            Explore all collections
          </Link>
        </div>

        {error ? (
          <EmptyState
            title="Featured products unavailable"
            description="The catalog service could not be reached. Start the API to load featured items."
          />
        ) : products.length === 0 ? (
          <EmptyState
            title="No featured products yet"
            description="Mark products as featured in the development catalog seed."
          />
        ) : (
          <Grid cols={3}>
            {products.map((product) => (
              <ProductCard
                key={product.id}
                name={product.name}
                category={product.category.name}
                subcategory={product.subcategory.name}
                priceLabel={formatProductPrice(product)}
                imageSrc={product.primaryImage ?? undefined}
                imageAlt={product.images[0]?.altText ?? product.name}
                tileSize={product.tileSize}
                tileSizeLabel={product.tileSizeLabel}
                tileAspectRatio={product.tileAspectRatio}
                badge="featured"
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
        )}
      </Container>
    </section>
  );
}
