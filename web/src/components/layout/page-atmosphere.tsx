import { cn } from "@/lib/cn";

export const PAGE_ATMOSPHERES = {
  marble: {
    src: "/images/atmospheres/marble.jpg",
    alt: "Calacatta marble tile atmosphere",
  },
  porcelain: {
    src: "/images/atmospheres/porcelain.jpg",
    alt: "Porcelain floor tile atmosphere",
  },
  stone: {
    src: "/images/atmospheres/stone.jpg",
    alt: "Stone-effect ceramic texture atmosphere",
  },
  interior: {
    src: "/images/atmospheres/interior.jpg",
    alt: "Architectural tile interior atmosphere",
  },
} as const;

export type PageAtmosphereKey = keyof typeof PAGE_ATMOSPHERES;

/**
 * Fixed full-viewport atmosphere behind storefront pages.
 * Uses a plain <img> (not Next Image resizing) so the material stays crisp.
 */
export function PageAtmosphere({
  variant = "marble",
  className,
}: {
  variant?: PageAtmosphereKey;
  className?: string;
}) {
  const atmosphere = PAGE_ATMOSPHERES[variant];

  return (
    <div
      className={cn(
        "pointer-events-none fixed inset-0 -z-10 overflow-hidden",
        className,
      )}
      aria-hidden
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={atmosphere.src}
        alt=""
        decoding="async"
        className="absolute inset-0 h-full w-full object-cover object-center"
      />
      {/* Light wash for readability — kept thin so texture stays clear */}
      <div className="absolute inset-0 bg-[linear-gradient(165deg,rgb(247_243_234_/_0.38)_0%,rgb(255_252_247_/_0.32)_50%,rgb(231_222_208_/_0.36)_100%)]" />
    </div>
  );
}
