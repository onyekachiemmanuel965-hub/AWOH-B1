import { cn } from "@/lib/cn";

type AlertVariant = "info" | "success" | "warning" | "error";

const styles: Record<AlertVariant, string> = {
  info: "border-info/25 bg-info-bg text-info",
  success: "border-success/25 bg-success-bg text-success",
  warning: "border-warning/25 bg-warning-bg text-warning",
  error: "border-error/25 bg-error-bg text-error",
};

export function Alert({
  variant = "info",
  title,
  children,
  className,
}: {
  variant?: AlertVariant;
  title?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      role="status"
      className={cn(
        "rounded-md border px-4 py-3 type-body-sm",
        styles[variant],
        className,
      )}
    >
      {title ? <p className="mb-1 type-label">{title}</p> : null}
      <div>{children}</div>
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-surface-muted",
        className,
      )}
      aria-hidden
    />
  );
}

export function LoadingSpinner({
  label = "Loading",
  className,
}: {
  label?: string;
  className?: string;
}) {
  return (
    <div
      className={cn("inline-flex items-center gap-3 text-text-muted", className)}
      role="status"
      aria-live="polite"
    >
      <span className="size-5 animate-spin rounded-full border-2 border-primary border-r-transparent" />
      <span className="type-body-sm">{label}</span>
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
  className,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-start gap-3 rounded-md border border-dashed border-border bg-surface px-6 py-10",
        className,
      )}
    >
      <h3 className="type-h4 text-primary">{title}</h3>
      {description ? (
        <p className="max-w-md type-body-sm text-text-muted">{description}</p>
      ) : null}
      {action}
    </div>
  );
}

export function ErrorState({
  title = "Something went wrong",
  description = "Please try again. If the problem continues, contact support.",
  action,
  className,
}: {
  title?: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-start gap-3 rounded-md border border-error/25 bg-error-bg px-6 py-8",
        className,
      )}
    >
      <h3 className="type-h4 text-error">{title}</h3>
      <p className="max-w-md type-body-sm text-error/90">{description}</p>
      {action}
    </div>
  );
}
