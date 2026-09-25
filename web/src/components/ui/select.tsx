import { cn } from "@/lib/cn";

export type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
  hint?: string;
  error?: string;
  id: string;
  options: Array<{ value: string; label: string; disabled?: boolean }>;
  placeholder?: string;
};

export function Select({
  className,
  label,
  hint,
  error,
  id,
  options,
  placeholder,
  disabled,
  ...props
}: SelectProps) {
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;

  return (
    <div className="flex w-full flex-col gap-1.5">
      {label ? (
        <label htmlFor={id} className="type-label text-text">
          {label}
        </label>
      ) : null}
      <select
        id={id}
        disabled={disabled}
        aria-invalid={Boolean(error) || undefined}
        aria-describedby={describedBy}
        className={cn(
          "h-11 w-full appearance-none rounded-md border bg-surface px-3 type-body text-text",
          "bg-[length:1rem] bg-[right_0.75rem_center] bg-no-repeat pr-10",
          "bg-[url('data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2216%22 height=%2216%22 fill=%22none%22 stroke=%22%235C6570%22 stroke-width=%221.5%22%3E%3Cpath d=%22m4 6 4 4 4-4%22/%3E%3C/svg%3E')]",
          "transition-[border-color,box-shadow] duration-[var(--duration-fast)]",
          "focus-visible:border-accent focus-visible:shadow-[0_0_0_3px_color-mix(in_srgb,var(--color-accent)_28%,transparent)]",
          "disabled:cursor-not-allowed disabled:bg-surface-muted disabled:opacity-70",
          error ? "border-error" : "border-border",
          className,
        )}
        {...props}
      >
        {placeholder ? (
          <option value="" disabled>
            {placeholder}
          </option>
        ) : null}
        {options.map((opt) => (
          <option
            key={opt.value || `empty-${opt.label}`}
            value={opt.value}
            disabled={opt.disabled}
          >
            {opt.label}
          </option>
        ))}
      </select>
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
