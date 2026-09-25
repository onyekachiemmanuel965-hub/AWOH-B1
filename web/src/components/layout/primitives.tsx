import { cn } from "@/lib/cn";

type ContainerProps = React.HTMLAttributes<HTMLDivElement> & {
  width?: "default" | "wide" | "narrow";
};

export function Container({
  className,
  width = "default",
  children,
  ...props
}: ContainerProps) {
  return (
    <div
      className={cn(
        "mx-auto w-full px-4 sm:px-6 lg:px-8",
        width === "default" && "max-w-[var(--container-max)]",
        width === "wide" && "max-w-[var(--container-wide)]",
        width === "narrow" && "max-w-3xl",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

type SectionProps = React.HTMLAttributes<HTMLElement> & {
  muted?: boolean;
  fullBleed?: boolean;
};

export function Section({
  className,
  muted,
  fullBleed,
  children,
  ...props
}: SectionProps) {
  return (
    <section
      className={cn(
        "py-12 md:py-16 lg:py-20",
        muted && "bg-surface-muted",
        fullBleed && "w-full",
        className,
      )}
      {...props}
    >
      {children}
    </section>
  );
}

type StackProps = React.HTMLAttributes<HTMLDivElement> & {
  gap?: "sm" | "md" | "lg" | "xl";
};

const gapMap = {
  sm: "gap-2",
  md: "gap-4",
  lg: "gap-6",
  xl: "gap-10",
};

export function Stack({
  className,
  gap = "md",
  children,
  ...props
}: StackProps) {
  return (
    <div className={cn("flex flex-col", gapMap[gap], className)} {...props}>
      {children}
    </div>
  );
}

export function Cluster({
  className,
  gap = "md",
  children,
  ...props
}: StackProps) {
  return (
    <div
      className={cn("flex flex-wrap items-center", gapMap[gap], className)}
      {...props}
    >
      {children}
    </div>
  );
}

type GridProps = React.HTMLAttributes<HTMLDivElement> & {
  cols?: 1 | 2 | 3 | 4;
};

export function Grid({ className, cols = 3, children, ...props }: GridProps) {
  return (
    <div
      className={cn(
        "grid gap-6",
        cols === 1 && "grid-cols-1",
        cols === 2 && "grid-cols-1 md:grid-cols-2",
        cols === 3 && "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
        cols === 4 && "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
