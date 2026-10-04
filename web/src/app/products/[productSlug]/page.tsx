import Link from "next/link";
import { notFound } from "next/navigation";
import { StorefrontShell } from "@/components/layout/storefront-shell";
import { Container, Section } from "@/components/layout/primitives";
import { ProductDetailClient } from "@/components/product/product-detail-client";
import { createPageMetadata } from "@/lib/metadata";
import { fetchProduct } from "@/lib/api";

type Params = Promise<{ productSlug: string }>;

export async function generateMetadata({ params }: { params: Params }) {
  const { productSlug } = await params;
  try {
    const product = await fetchProduct(productSlug);
    return createPageMetadata({
      title: product.name,
      description: product.description.slice(0, 160),
      path: `/products/${product.slug}`,
    });
  } catch {
    return createPageMetadata({
      title: "Product not found",
      path: `/products/${productSlug}`,
    });
  }
}

export default async function ProductDetailPage({
  params,
}: {
  params: Params;
}) {
  const { productSlug } = await params;
  let product;
  try {
    product = await fetchProduct(productSlug);
  } catch {
    notFound();
  }

  return (
    <StorefrontShell atmosphere="stone">
        <Section className="!py-10 md:!py-16">
          <Container width="wide">
            <nav className="mb-8 type-caption text-text-muted" aria-label="Breadcrumb">
              <Link href="/products" className="hover:text-primary">
                Collections
              </Link>
              <span aria-hidden> / </span>
              <Link
                href={`/categories/${product.category.slug}`}
                className="hover:text-primary"
              >
                {product.category.name}
              </Link>
              <span aria-hidden> / </span>
              <Link
                href={`/categories/${product.category.slug}/${product.subcategory.slug}`}
                className="hover:text-primary"
              >
                {product.subcategory.name}
              </Link>
            </nav>
            <ProductDetailClient product={product} />
          </Container>
        </Section>
      </StorefrontShell>
  );
}
