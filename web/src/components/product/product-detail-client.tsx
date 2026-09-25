"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { QuantitySelector } from "@/components/ui/search-input";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/components/cart/cart-provider";
import type { PublicProduct } from "@/lib/api";
import { formatProductPrice } from "@/lib/api";
import { tileAspectRatioCss } from "@/lib/tile-size";

export function ProductDetailClient({ product }: { product: PublicProduct }) {
  const { addItem } = useCart();
  const images = useMemo(
    () =>
      [...product.images].sort((a, b) => a.sortOrder - b.sortOrder),
    [product.images],
  );
  const [active, setActive] = useState(images[0]?.id ?? "");
  const [qty, setQty] = useState(1);
  const current = images.find((i) => i.id === active) ?? images[0];
  const available = product.availability === "AVAILABLE";
  const aspect = tileAspectRatioCss(
    product.tileSize,
    product.tileAspectRatio,
  );

  return (
    <div className="grid gap-10 lg:grid-cols-2 lg:gap-14">
      <div className="space-y-4">
        <div
          className="relative w-full overflow-hidden border border-border bg-surface-muted"
          style={{ aspectRatio: aspect }}
        >
          {current ? (
            <Image
              src={current.url}
              alt={current.altText ?? product.name}
              fill
              priority
              unoptimized={current.url.endsWith(".svg")}
              className="object-contain"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
          ) : null}
        </div>
        {images.length > 1 ? (
          <ul className="flex list-none gap-2 overflow-x-auto p-0">
            {images.map((img) => (
              <li key={img.id}>
                <button
                  type="button"
                  onClick={() => setActive(img.id)}
                  className={`relative size-20 overflow-hidden border ${
                    img.id === current?.id
                      ? "border-primary"
                      : "border-border"
                  }`}
                  aria-label={`Show image ${img.sortOrder + 1}`}
                  aria-pressed={img.id === current?.id}
                >
                  <Image
                    src={img.url}
                    alt={img.altText ?? ""}
                    fill
                    unoptimized={img.url.endsWith(".svg")}
                    className="object-contain"
                    sizes="80px"
                  />
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      <div className="flex flex-col gap-6">
        <div className="space-y-3">
          <p className="type-caption uppercase tracking-[0.12em] text-text-muted">
            {product.category.name} · {product.subcategory.name}
          </p>
          <h1 className="type-h1 text-primary">{product.name}</h1>
          <p className="type-h3 text-text">{formatProductPrice(product)}</p>
          {product.tileSizeLabel ? (
            <dl className="flex gap-4 type-body-sm">
              <dt className="text-text-muted">Tile Size</dt>
              <dd className="text-primary">{product.tileSizeLabel}</dd>
            </dl>
          ) : null}
          <Badge variant={available ? "available" : "out-of-stock"} />
        </div>

        <p className="type-body text-text-muted">{product.description}</p>

        {product.specs ? (
          <dl className="grid gap-2 border-t border-border pt-4">
            {Object.entries(product.specs).map(([key, value]) => (
              <div key={key} className="flex justify-between gap-4 type-body-sm">
                <dt className="text-text-muted capitalize">{key}</dt>
                <dd className="text-text">{value}</dd>
              </div>
            ))}
          </dl>
        ) : null}

        <div className="flex flex-col gap-4 border-t border-border pt-6 sm:flex-row sm:items-end">
          <QuantitySelector
            id="product-qty"
            value={qty}
            onChange={setQty}
            min={1}
            max={99}
          />
          <Button
            type="button"
            disabled={!available}
            onClick={() => addItem(product.id, qty)}
          >
            Add to cart
          </Button>
        </div>
      </div>
    </div>
  );
}
