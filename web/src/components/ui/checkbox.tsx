import { cn } from "@/lib/cn";

type CheckProps = {
  id: string;
  label: string;
  hint?: string;
  className?: string;
  checked?: boolean;
  defaultChecked?: boolean;
  disabled?: boolean;
  onChange?: React.ChangeEventHandler<HTMLInputElement>;
  name?: string;
};

export function Checkbox({
  id,
  label,
  hint,
  className,
  ...props
}: CheckProps) {
  return (
    <div className={cn("flex gap-3", className)}>
      <input
        id={id}
        type="checkbox"
        className="mt-1 size-4 shrink-0 rounded-sm border border-border-strong accent-primary"
        {...props}
      />
      <div className="flex flex-col gap-0.5">
        <label htmlFor={id} className="type-body-sm text-text">
          {label}
        </label>
        {hint ? <p className="type-caption text-text-muted">{hint}</p> : null}
      </div>
    </div>
  );
}

export function Radio({
  id,
  label,
  hint,
  name,
  className,
  ...props
}: CheckProps & { name: string }) {
  return (
    <div className={cn("flex gap-3", className)}>
      <input
        id={id}
        type="radio"
        name={name}
        className="mt-1 size-4 shrink-0 border border-border-strong accent-primary"
        {...props}
      />
      <div className="flex flex-col gap-0.5">
        <label htmlFor={id} className="type-body-sm text-text">
          {label}
        </label>
        {hint ? <p className="type-caption text-text-muted">{hint}</p> : null}
      </div>
    </div>
  );
}

export type SwitchProps = {
  id: string;
  label: string;
  checked?: boolean;
  defaultChecked?: boolean;
  disabled?: boolean;
  onChange?: React.ChangeEventHandler<HTMLInputElement>;
  className?: string;
};

export function Switch({ id, label, className, ...props }: SwitchProps) {
  return (
    <label
      htmlFor={id}
      className={cn("inline-flex cursor-pointer items-center gap-3", className)}
    >
      <span className="relative inline-flex h-6 w-11 items-center">
        <input
          id={id}
          type="checkbox"
          role="switch"
          className="peer sr-only"
          {...props}
        />
        <span className="absolute inset-0 rounded-full bg-surface-muted transition-colors peer-checked:bg-primary peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-focus peer-disabled:opacity-50" />
        <span className="absolute left-0.5 size-5 rounded-full bg-surface shadow-sm transition-transform peer-checked:translate-x-5" />
      </span>
      <span className="type-body-sm text-text">{label}</span>
    </label>
  );
}
