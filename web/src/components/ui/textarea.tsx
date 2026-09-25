import { cn } from "@/lib/cn";

export type TextareaProps =
  React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
    label?: string;
    hint?: string;
    error?: string;
    id: string;
  };

export function Textarea({
  className,
  label,
  hint,
  error,
  id,
  disabled,
  rows = 4,
  ...props
}: TextareaProps) {
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;

  return (
    <div className="flex w-full flex-col gap-1.5">
      {label ? (
        <label htmlFor={id} className="type-label text-text">
          {label}
        </label>
      ) : null}
      <textarea
        id={id}
        rows={rows}
        disabled={disabled}
        aria-invalid={Boolean(error) || undefined}
        aria-describedby={describedBy}
        className={cn(
          "w-full resize-y rounded-md border bg-surface px-3 py-2.5 type-body text-text placeholder:text-text-muted/70",
          "transition-[border-color,box-shadow] duration-[var(--duration-fast)]",
          "focus-visible:border-accent focus-visible:shadow-[0_0_0_3px_color-mix(in_srgb,var(--color-accent)_28%,transparent)]",
          "disabled:cursor-not-allowed disabled:bg-surface-muted disabled:opacity-70",
          error ? "border-error" : "border-border",
          className,
        )}
        {...props}
      />
      {error ? (
        <p id={`${id}-error`} className="type-caption text-error" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="type-caption text-text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
