"use client";

import { useEffect, useId, useRef } from "react";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/button";

export type ModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm?: () => void;
  destructive?: boolean;
  className?: string;
};

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  confirmLabel,
  cancelLabel = "Cancel",
  onConfirm,
  destructive,
  className,
}: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descId = useId();

  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      className={cn(
        "m-auto w-[min(100%-2rem,28rem)] rounded-md border border-border bg-surface p-0 text-text shadow-md backdrop:bg-primary/45",
        "open:motion-fade-in",
        className,
      )}
      aria-labelledby={titleId}
      aria-describedby={description ? descId : undefined}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === dialogRef.current) onClose();
      }}
    >
      <div className="flex flex-col gap-4 p-6">
        <div className="flex flex-col gap-2">
          <h2 id={titleId} className="type-h4 text-primary">
            {title}
          </h2>
          {description ? (
            <p id={descId} className="type-body-sm text-text-muted">
              {description}
            </p>
          ) : null}
        </div>
        {children}
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={onClose}>
            {cancelLabel}
          </Button>
          {onConfirm && confirmLabel ? (
            <Button
              variant={destructive ? "destructive" : "primary"}
              onClick={onConfirm}
            >
              {confirmLabel}
            </Button>
          ) : null}
        </div>
      </div>
    </dialog>
  );
}

export function Tooltip({
  content,
  children,
  className,
}: {
  content: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span className={cn("relative inline-flex group/tooltip", className)}>
      {children}
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 z-[var(--z-dropdown)] mb-2 -translate-x-1/2 whitespace-nowrap rounded-sm bg-primary px-2 py-1 type-caption text-text-inverse opacity-0 transition-opacity group-hover/tooltip:opacity-100 group-focus-within/tooltip:opacity-100"
      >
        {content}
      </span>
    </span>
  );
}
