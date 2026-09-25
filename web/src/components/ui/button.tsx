import { cn } from "@/lib/cn";

type ButtonVariant =
  | "primary"
  | "secondary"
  | "outline"
  | "ghost"
  | "destructive"
  | "link";
type ButtonSize = "sm" | "md" | "lg";

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
};

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-primary text-text-inverse border border-primary hover:bg-primary-hover active:bg-primary-active",
  secondary:
    "bg-surface text-primary border border-border hover:border-border-strong hover:bg-surface-muted",
  outline:
    "bg-transparent text-primary border border-primary/30 hover:border-primary hover:bg-primary/5",
  ghost:
    "bg-transparent text-text border border-transparent hover:bg-surface-muted",
  destructive:
    "bg-error text-text-inverse border border-error hover:opacity-90",
  link: "bg-transparent text-primary border-transparent underline-offset-4 hover:underline px-0",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-9 px-3 type-caption",
  md: "h-11 px-5 type-button",
  lg: "h-12 px-6 type-button text-[0.9375rem]",
};

export function Button({
  className,
  variant = "primary",
  size = "md",
  loading = false,
  disabled,
  children,
  type = "button",
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <button
      type={type}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-md transition-[background-color,border-color,opacity,transform] duration-[var(--duration-fast)] ease-[var(--ease-out)]",
        "disabled:pointer-events-none disabled:opacity-45",
        variant !== "link" && "shadow-xs",
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? (
        <span
          className="size-4 animate-spin rounded-full border-2 border-current border-r-transparent"
          aria-hidden
        />
      ) : null}
      <span>{children}</span>
    </button>
  );
}
