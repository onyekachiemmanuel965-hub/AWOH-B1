import Link from "next/link";
import { notFound } from "next/navigation";
import { StorefrontShell } from "@/components/layout/storefront-shell";
import { Container, Section, Grid } from "@/components/layout/primitives";
import { ProductCard } from "@/components/product/product-card";
import { EmptyState } from "@/components/feedback/feedback";
import { createPageMetadata } from "@/lib/metadata";
import {
  fetchProducts,
  fetchSubcategory,
  formatProductPrice,
  mediaUrl,
} from "@/lib/api";

type Params = Promise<{ categorySlug: string; subcategorySlug: string }>;

export async function generateMetadata({ params }: { params: Params }) {
  const { categorySlug, subcategorySlug } = await params;
  try {
    const sub = await fetchSubcategory(categorySlug, subcategorySlug);
    return createPageMetadata({
      title: `${sub.name} · ${sub.category.name}`,
      description:
        sub.description ??
        `${sub.name} in ${sub.category.name} — AWOH-B THE GREAT TILES VENTURE.`,
      path: `/categories/${categorySlug}/${subcategorySlug}`,
    });
  } catch {
    return createPageMetadata({
      title: "Subcategory not found",
      path: `/categories/${categorySlug}/${subcategorySlug}`,
    });
  }
}

export default async function SubcategoryPage({ params }: { params: Params }) {
  const { categorySlug, subcategorySlug } = await params;
  let subcategory;
  try {
    subcategory = await fetchSubcategory(categorySlug, subcategorySlug);
  } catch {
    notFound();
  }

  const products = await fetchProducts({
    category: categorySlug,
    subcategory: subcategorySlug,
    limit: 24,
  });

  return (
    <StorefrontShell atmosphere="porcelain">
        <Section className="border-b border-border bg-surface-muted !py-12">
          <Container width="wide">
            <nav className="type-caption text-text-muted" aria-label="Breadcrumb">
              <Link href="/products" className="hover:text-primary">
                Collections
              </Link>
              <span aria-hidden> / </span>
              <Link
                href={`/categories/${subcategory.category.slug}`}
                className="hover:text-primary"
              >
                {subcategory.category.name}
              </Link>
            </nav>
            <h1 className="mt-3 type-h1 text-primary">{subcategory.name}</h1>
            {subcategory.description ? (
              <p className="mt-3 max-w-2xl type-body text-text-muted">
                {subcategory.description}
              </p>
            ) : null}
          </Container>
        </Section>

        <Section className="!py-10">
          <Container width="wide">
            {products.data.length === 0 ? (
              <EmptyState
                title="No products in this subcategory"
                description="Browse the parent category or full collections."
                action={
                  <Link
                    href={`/categories/${subcategory.category.slug}`}
                    className="type-label text-primary"
                  >
                    Back to {subcategory.category.name}
                  </Link>
                }
              />
            ) : (
              <Grid cols={3}>
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
          </Container>
        </Section>
      </StorefrontShell>
  );
}
