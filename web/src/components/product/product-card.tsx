import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/cn";
import { Badge, type BadgeVariant } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { tileAspectRatioCss } from "@/lib/tile-size";
import { AddToCartIconButton } from "@/components/product/add-to-cart-icon-button";

export type ProductCardProps = {
  /** Required for add-to-cart; omit on design-system demos without cart. */
  productId?: string;
  name: string;
  category?: string;
  subcategory?: string;
  priceLabel?: string;
  availability?: "available" | "low-stock" | "out-of-stock";
  badge?: BadgeVariant;
  imageSrc?: string;
  imageAlt?: string;
  className?: string;
  /** Prefer href for static pages; onQuickAction for client demos */
  href?: string;
  onQuickAction?: () => void;
  quickActionLabel?: string;
  /** Machine key e.g. 60x60 or enum code */
  tileSize?: string | null;
  tileSizeLabel?: string | null;
  tileAspectRatio?: number | null;
};

const availabilityBadge: Record<
  NonNullable<ProductCardProps["availability"]>,
  BadgeVariant
> = {
  available: "available",
  "low-stock": "low-stock",
  "out-of-stock": "out-of-stock",
};

/**
 * Catalog product card — prices/availability supplied by callers from API data.
 * Image frame uses product tile aspect ratio without geometric stretch.
 */
export function ProductCard({
  productId,
  name,
  category,
  subcategory,
  priceLabel = "Price on request",
  availability = "available",
  badge,
  imageSrc,
  imageAlt,
  className,
  href,
  onQuickAction,
  quickActionLabel = "View",
  tileSize,
  tileSizeLabel,
  tileAspectRatio,
}: ProductCardProps) {
  const canAdd =
    Boolean(productId) &&
    availability !== "out-of-stock";

  const action = href ? (
    <Link
      href={href}
      className="inline-flex h-9 items-center justify-center rounded-md border border-primary/30 bg-transparent px-3 type-caption text-primary no-underline transition-colors hover:border-primary hover:bg-primary/5"
      aria-label={`${quickActionLabel} ${name}`}
    >
      {quickActionLabel}
    </Link>
  ) : onQuickAction ? (
    <Button
      variant="outline"
      size="sm"
      onClick={onQuickAction}
      aria-label={`${quickActionLabel} ${name}`}
    >
      {quickActionLabel}
    </Button>
  ) : null;

  const aspect = tileAspectRatioCss(tileSize, tileAspectRatio);

  return (
    <article
      className={cn(
        "group flex flex-col overflow-hidden rounded-md border border-border bg-surface shadow-xs",
        "transition-[border-color,box-shadow] duration-[var(--duration-fast)] hover:border-border-strong hover:shadow-sm",
        className,
      )}
    >
      <div
        className="relative w-full overflow-hidden bg-surface-muted"
        style={{ aspectRatio: aspect }}
      >
        {imageSrc ? (
          <Image
            src={imageSrc}
            alt={imageAlt ?? name}
            fill
            unoptimized={imageSrc.endsWith(".svg")}
            className="object-cover transition-transform duration-[var(--duration-slow)] ease-[var(--ease-out)] group-hover:scale-[1.02]"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div
            className="flex size-full items-end bg-[linear-gradient(145deg,#e7ded0_0%,#f7f3ea_45%,#d9d0c2_100%)] p-4"
            aria-hidden
          >
            <div className="h-1/2 w-full border border-dashed border-border-strong/60 bg-surface/40" />
          </div>
        )}
        {badge ? (
          <div className="absolute left-3 top-3 z-[1]">
            <Badge variant={badge} />
          </div>
        ) : null}
        {productId ? (
          <div className="absolute bottom-3 right-3 z-[2]">
            <AddToCartIconButton
              productId={productId}
              productName={name}
              disabled={!canAdd}
              className="shadow-sm"
            />
          </div>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        {(category || subcategory) && (
          <p className="type-caption uppercase tracking-[0.08em] text-text-muted">
            {[category, subcategory].filter(Boolean).join(" · ")}
          </p>
        )}
        <h3 className="type-h4 text-primary">
          {href ? (
            <Link href={href} className="text-inherit no-underline hover:underline">
              {name}
            </Link>
          ) : (
            name
          )}
        </h3>
        {tileSizeLabel ? (
          <p className="type-caption text-text-muted">{tileSizeLabel}</p>
        ) : null}
        <div className="mt-auto flex items-end justify-between gap-3 pt-1">
          <div className="flex flex-col gap-1.5">
            <p className="type-body font-medium text-text">{priceLabel}</p>
            <Badge variant={availabilityBadge[availability]} />
          </div>
          {action}
        </div>
      </div>
    </article>
  );
}
