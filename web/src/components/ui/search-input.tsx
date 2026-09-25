"use client";

import { cn } from "@/lib/cn";

export type SearchInputProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "type"
> & {
  label?: string;
  id: string;
};

export function SearchInput({
  className,
  label = "Search",
  id,
  ...props
}: SearchInputProps) {
  return (
    <div className={cn("relative w-full", className)}>
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <span
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
        aria-hidden
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.5" />
          <path d="m20 20-3.5-3.5" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      </span>
      <input
        id={id}
        type="search"
        className="h-11 w-full rounded-md border border-border bg-surface pl-10 pr-3 type-body text-text placeholder:text-text-muted/70 focus-visible:border-accent"
        {...props}
      />
    </div>
  );
}

export type QuantitySelectorProps = {
  id: string;
  value: number;
  min?: number;
  max?: number;
  onChange: (value: number) => void;
  label?: string;
  className?: string;
};

export function QuantitySelector({
  id,
  value,
  min = 1,
  max = 99,
  onChange,
  label = "Quantity",
  className,
}: QuantitySelectorProps) {
  const dec = () => onChange(Math.max(min, value - 1));
  const inc = () => onChange(Math.min(max, value + 1));

  return (
    <div className={cn("inline-flex flex-col gap-1.5", className)}>
      <span className="type-label text-text" id={`${id}-label`}>
        {label}
      </span>
      <div
        className="inline-flex h-11 items-stretch overflow-hidden rounded-md border border-border bg-surface"
        role="group"
        aria-labelledby={`${id}-label`}
      >
        <button
          type="button"
          className="w-11 type-button text-text hover:bg-surface-muted disabled:opacity-40"
          onClick={dec}
          disabled={value <= min}
          aria-label="Decrease quantity"
        >
          −
        </button>
        <input
          id={id}
          type="number"
          className="w-14 border-x border-border bg-transparent text-center type-body [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          value={value}
          min={min}
          max={max}
          onChange={(e) => {
            const next = Number(e.target.value);
            if (Number.isNaN(next)) return;
            onChange(Math.min(max, Math.max(min, next)));
          }}
        />
        <button
          type="button"
          className="w-11 type-button text-text hover:bg-surface-muted disabled:opacity-40"
          onClick={inc}
          disabled={value >= max}
          aria-label="Increase quantity"
        >
          +
        </button>
      </div>
    </div>
  );
}
