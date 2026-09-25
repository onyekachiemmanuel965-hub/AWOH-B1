import { cn } from "@/lib/cn";

export type BadgeVariant =
  | "new"
  | "featured"
  | "available"
  | "low-stock"
  | "out-of-stock"
  | "pending"
  | "paid"
  | "failed"
  | "processing"
  | "completed"
  | "neutral";

const styles: Record<BadgeVariant, string> = {
  new: "bg-info-bg text-info border-info/20",
  featured: "bg-warning-bg text-warning border-warning/25",
  available: "bg-success-bg text-success border-success/20",
  "low-stock": "bg-warning-bg text-warning border-warning/25",
  "out-of-stock": "bg-error-bg text-error border-error/20",
  pending: "bg-surface-muted text-text-muted border-border",
  paid: "bg-success-bg text-success border-success/20",
  failed: "bg-error-bg text-error border-error/20",
  processing: "bg-info-bg text-info border-info/20",
  completed: "bg-success-bg text-success border-success/20",
  neutral: "bg-surface text-text-muted border-border",
};

const labels: Record<BadgeVariant, string> = {
  new: "New",
  featured: "Featured",
  available: "Available",
  "low-stock": "Low stock",
  "out-of-stock": "Out of stock",
  pending: "Pending",
  paid: "Paid",
  failed: "Failed",
  processing: "Processing",
  completed: "Completed",
  neutral: "Status",
};

export type BadgeProps = {
  variant?: BadgeVariant;
  children?: React.ReactNode;
  className?: string;
};

export function Badge({
  variant = "neutral",
  children,
  className,
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-sm border px-2 py-0.5 type-caption uppercase tracking-[0.06em]",
        styles[variant],
        className,
      )}
    >
      {children ?? labels[variant]}
    </span>
  );
}
