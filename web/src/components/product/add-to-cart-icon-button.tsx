"use client";

import { useCart } from "@/components/cart/cart-provider";
import { cn } from "@/lib/cn";

function CartBagIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M6 6h15l-1.5 9h-12z" />
      <path d="M6 6 5 3H2" />
      <circle cx="9" cy="20" r="1.25" fill="currentColor" stroke="none" />
      <circle cx="18" cy="20" r="1.25" fill="currentColor" stroke="none" />
    </svg>
  );
}

type AddToCartIconButtonProps = {
  productId: string;
  productName: string;
  disabled?: boolean;
  className?: string;
};

/**
 * Compact add-to-cart control for catalog cards.
 */
export function AddToCartIconButton({
  productId,
  productName,
  disabled = false,
  className,
}: AddToCartIconButtonProps) {
  const { addItem } = useCart();

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (disabled) return;
        addItem(productId, 1);
      }}
      aria-label={
        disabled ? `${productName} is unavailable` : `Add ${productName} to cart`
      }
      title={disabled ? "Unavailable" : "Add to cart"}
      className={cn(
        "inline-flex size-10 shrink-0 items-center justify-center rounded-md border border-primary bg-primary text-text-inverse shadow-xs",
        "transition-[background-color,opacity,transform] duration-[var(--duration-fast)] ease-[var(--ease-out)]",
        "hover:bg-primary-hover active:scale-[0.97]",
        "disabled:pointer-events-none disabled:opacity-40",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
        className,
      )}
    >
      <CartBagIcon className="size-5" />
    </button>
  );
}
