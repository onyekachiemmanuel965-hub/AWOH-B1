import Image from "next/image";
import { mediaUrl } from "@/lib/api";

/**
 * Optional full-width page banner for About / Contact / Products / Categories.
 * When using a placeholder SVG, keep unoptimized; uploaded JPG/PNG/WEBP also fine.
 */
export function PageImageBanner({
  src,
  alt,
  className = "relative h-48 w-full overflow-hidden border-b border-border md:h-64",
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  const resolved = mediaUrl(src);
  if (!resolved) return null;
  return (
    <div className={className}>
      <Image
        src={resolved}
        alt={alt}
        fill
        unoptimized
        priority={false}
        className="object-cover object-center"
        sizes="100vw"
      />
      <div
        className="absolute inset-0 bg-gradient-to-t from-background/40 to-transparent"
        aria-hidden
      />
    </div>
  );
}
