"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { StorefrontShell } from "@/components/layout/storefront-shell";
import { Container, Section } from "@/components/layout/primitives";
import { Button } from "@/components/ui/button";
import { QuantitySelector } from "@/components/ui/search-input";
import {
  EmptyState,
  ErrorState,
  LoadingSpinner,
} from "@/components/feedback/feedback";
import { ImageZoomLightbox } from "@/components/product/image-zoom-lightbox";
import { useCart } from "@/components/cart/cart-provider";
import { formatMoney } from "@/lib/money";
import { resolveProducts, mediaUrl, type PublicProduct } from "@/lib/api";

export default function CartPage() {
  const { items, setQuantity, removeItem, clear } = useCart();
  const [products, setProducts] = useState<PublicProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const ids = items.map((i) => i.productId);
        const resolved = await resolveProducts(ids);
        if (!cancelled) setProducts(resolved);
      } catch {
        if (!cancelled) {
          setError("Unable to refresh cart prices from the catalog service.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [items]);

  const lines = useMemo(() => {
    return items
      .map((line) => {
        const product = products.find((p) => p.id === line.productId);
        if (!product) return null;
        const unit = Number(product.price);
        const lineTotal = unit * line.quantity;
        return { line, product, unit, lineTotal };
      })
      .filter(Boolean) as Array<{
      line: { productId: string; quantity: number };
      product: PublicProduct;
      unit: number;
      lineTotal: number;
    }>;
  }, [items, products]);

  const subtotal = lines.reduce((sum, row) => sum + row.lineTotal, 0);
  const currency = lines[0]?.product.currency ?? "NGN";

  return (
    <StorefrontShell atmosphere="marble">
        <Section className="!py-12">
          <Container className="space-y-8">
            <div>
              <p className="type-caption uppercase tracking-[0.16em] text-accent">
                Cart
              </p>
              <h1 className="mt-2 type-h1 text-primary">Your selection</h1>
              <p className="mt-2 type-body text-text-muted">
                Display totals use live catalog prices for review. The cart
                stores only product IDs and quantities — checkout totals are
                calculated authoritatively by the server.
              </p>
            </div>

            {loading ? (
              <LoadingSpinner label="Refreshing cart…" />
            ) : error ? (
              <ErrorState title="Cart sync issue" description={error} />
            ) : items.length === 0 ? (
              <EmptyState
                title="Your cart is empty"
                description="Browse collections to add materials."
                action={
                  <Link
                    href="/products"
                    className="inline-flex h-11 items-center justify-center rounded-md border border-primary bg-primary px-5 type-button text-text-inverse no-underline"
                  >
                    Explore collections
                  </Link>
                }
              />
            ) : (
              <div className="space-y-6">
                <ul className="list-none space-y-4 p-0">
                  {lines.map(({ line, product, unit, lineTotal }) => (
                    <li
                      key={line.productId}
                      className="grid gap-4 border border-border bg-surface p-4 sm:grid-cols-[5rem_1fr_auto]"
                    >
                      <div className="relative aspect-square overflow-hidden bg-surface-muted">
                        {product.primaryImage ? (
                          <ImageZoomLightbox
                            src={mediaUrl(product.primaryImage)}
                            alt={product.images[0]?.altText ?? product.name}
                            hint="Zoom"
                          >
                            <span className="relative block aspect-square">
                              <Image
                                src={mediaUrl(product.primaryImage)}
                                alt={
                                  product.images[0]?.altText ?? product.name
                                }
                                fill
                                unoptimized={product.primaryImage.endsWith(
                                  ".svg",
                                )}
                                className="object-cover"
                                sizes="80px"
                              />
                            </span>
                          </ImageZoomLightbox>
                        ) : null}
                      </div>
                      <div className="space-y-2">
                        <Link
                          href={`/products/${product.slug}`}
                          className="type-h4 text-primary no-underline hover:underline"
                        >
                          {product.name}
                        </Link>
                        <p className="type-caption text-text-muted">
                          {formatMoney(unit, product.currency)} each
                        </p>
                        <QuantitySelector
                          id={`qty-${product.id}`}
                          value={line.quantity}
                          onChange={(value) =>
                            setQuantity(product.id, value)
                          }
                        />
                      </div>
                      <div className="flex flex-col items-start gap-3 sm:items-end">
                        <p className="type-body font-medium">
                          {formatMoney(lineTotal, product.currency)}
                        </p>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeItem(product.id)}
                        >
                          Remove
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>

                <div className="flex flex-col gap-4 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="type-label text-text-muted">
                      Subtotal (display only)
                    </p>
                    <p className="type-h3 text-primary">
                      {formatMoney(subtotal, currency)}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <Link
                      href="/checkout"
                      className="inline-flex h-11 items-center justify-center rounded-md border border-primary bg-primary px-5 type-button text-text-inverse no-underline"
                    >
                      Checkout
                    </Link>
                    <Button variant="ghost" onClick={clear}>
                      Clear cart
                    </Button>
                    <Link
                      href="/products"
                      className="inline-flex h-11 items-center justify-center rounded-md border border-border bg-surface px-5 type-button text-primary no-underline hover:border-primary"
                    >
                      Continue shopping
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </Container>
        </Section>
      </StorefrontShell>
  );
}
