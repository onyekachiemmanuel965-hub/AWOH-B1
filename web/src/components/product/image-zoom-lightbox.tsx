"use client";

import Image from "next/image";
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { cn } from "@/lib/cn";

type ImageZoomLightboxProps = {
  src: string;
  alt: string;
  /** Preview shown in-page; tap/click opens the zoom viewer */
  children: ReactNode;
  className?: string;
  /** Optional caption under the preview (e.g. “Tap to zoom”) */
  hint?: string;
};

/**
 * Tap/click a product image to open a full-view lightbox with pinch/click zoom.
 */
export function ImageZoomLightbox({
  src,
  alt,
  children,
  className,
  hint = "Tap to zoom",
}: ImageZoomLightboxProps) {
  const [open, setOpen] = useState(false);
  const [scale, setScale] = useState(1);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const tipId = useId();

  const close = useCallback(() => {
    setOpen(false);
    setScale(1);
  }, []);

  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "+" || e.key === "=") setScale((s) => Math.min(3, s + 0.5));
      if (e.key === "-") setScale((s) => Math.max(1, s - 0.5));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close]);

  function openViewer() {
    if (!src) return;
    setScale(1);
    setOpen(true);
  }

  function toggleZoom() {
    setScale((s) => (s >= 2 ? 1 : s + 0.5));
  }

  return (
    <div className={cn("relative", className)}>
      <button
        type="button"
        onClick={openViewer}
        className="block w-full cursor-zoom-in border-0 bg-transparent p-0 text-left"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? titleId : undefined}
        aria-describedby={hint ? tipId : undefined}
      >
        {children}
      </button>
      {hint ? (
        <p
          id={tipId}
          className="pointer-events-none absolute bottom-3 left-3 rounded-sm bg-primary/75 px-2 py-1 type-caption text-text-inverse"
        >
          {hint}
        </p>
      ) : null}

      <dialog
        ref={dialogRef}
        className={cn(
          "fixed inset-0 m-0 h-dvh max-h-none w-screen max-w-none border-0 bg-primary/92 p-0 text-text-inverse",
          "open:flex open:flex-col backdrop:bg-primary/80",
        )}
        aria-labelledby={titleId}
        onClose={close}
        onClick={(e) => {
          if (e.target === dialogRef.current) close();
        }}
      >
        <div className="flex items-center justify-between gap-3 border-b border-white/15 px-4 py-3">
          <h2 id={titleId} className="truncate type-label text-text-inverse">
            {alt || "Product image"}
          </h2>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              className="inline-flex h-9 min-w-9 items-center justify-center border border-white/30 px-2 type-caption text-text-inverse hover:bg-white/10"
              onClick={() => setScale((s) => Math.max(1, s - 0.5))}
              aria-label="Zoom out"
            >
              −
            </button>
            <span className="type-caption tabular-nums text-text-inverse/80">
              {Math.round(scale * 100)}%
            </span>
            <button
              type="button"
              className="inline-flex h-9 min-w-9 items-center justify-center border border-white/30 px-2 type-caption text-text-inverse hover:bg-white/10"
              onClick={() => setScale((s) => Math.min(3, s + 0.5))}
              aria-label="Zoom in"
            >
              +
            </button>
            <button
              type="button"
              className="ml-1 inline-flex h-9 items-center justify-center border border-white/30 px-3 type-caption text-text-inverse hover:bg-white/10"
              onClick={close}
            >
              Close
            </button>
          </div>
        </div>

        <div className="relative min-h-0 flex-1 overflow-auto">
          <button
            type="button"
            className="flex min-h-full w-full cursor-zoom-in items-center justify-center border-0 bg-transparent p-4 sm:p-8"
            onClick={toggleZoom}
            aria-label={scale > 1 ? "Zoom out image" : "Zoom in image"}
          >
            <span
              className="relative block max-h-[min(85dvh,900px)] w-full max-w-5xl transition-transform duration-[var(--duration-base)] ease-[var(--ease-out)]"
              style={{
                transform: `scale(${scale})`,
                transformOrigin: "center center",
              }}
            >
              <Image
                src={src}
                alt={alt}
                width={1600}
                height={1600}
                unoptimized={src.endsWith(".svg")}
                className="mx-auto h-auto max-h-[min(85dvh,900px)] w-auto max-w-full object-contain"
                sizes="100vw"
                priority
              />
            </span>
          </button>
        </div>

        <p className="border-t border-white/15 px-4 py-2 text-center type-caption text-text-inverse/70">
          Tap image to zoom · Esc to close
        </p>
      </dialog>
    </div>
  );
}
