import Link from "next/link";
import { cn } from "@/lib/cn";

/** Wordmark placeholder until official logo assets are provided. */
export function BrandMark({
  className,
  href = "/",
  inverse = false,
}: {
  className?: string;
  href?: string;
  inverse?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group inline-flex min-w-0 items-center gap-2 no-underline sm:gap-3",
        className,
      )}
      aria-label="AWOH-B THE GREAT TILES VENTURE home"
    >
      <span
        className={cn(
          "flex size-9 shrink-0 items-center justify-center border",
          inverse
            ? "border-accent/70 bg-transparent text-accent"
            : "border-accent/60 bg-primary text-accent",
        )}
        aria-hidden
      >
        <span className="font-brand-display text-lg leading-none tracking-wide">
          A
        </span>
      </span>
      <span className="flex min-w-0 flex-col leading-tight">
        <span
          className={cn(
            "truncate font-brand-display text-lg tracking-wide sm:text-xl",
            inverse
              ? "text-text-inverse"
              : "text-primary group-hover:text-primary-hover",
          )}
        >
          AWOH-B
        </span>
        <span
          className={cn(
            "hidden truncate type-caption uppercase tracking-[0.12em] md:block md:tracking-[0.14em]",
            inverse ? "text-accent/85" : "text-text-muted",
          )}
        >
          The Great Tiles Venture
        </span>
      </span>
    </Link>
  );
}
