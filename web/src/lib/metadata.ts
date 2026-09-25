import type { Metadata } from "next";

/**
 * Stage 09 — site metadata.
 * Do NOT hardcode a production domain. Set NEXT_PUBLIC_SITE_URL when known.
 */
const configuredUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();

export const siteConfig = {
  name: "AWOH-B THE GREAT TILES VENTURE",
  shortName: "AWOH-B",
  description:
    "Premium architectural tiles and finishing materials for refined spaces.",
  /**
   * Absolute site origin for canonical/OG URLs.
   * Falls back to localhost for local builds — never invent a client domain.
   */
  url: configuredUrl && configuredUrl.length > 0
    ? configuredUrl.replace(/\/$/, "")
    : "http://localhost:3000",
} as const;

export function createPageMetadata({
  title,
  description,
  path = "",
  noIndex = false,
}: {
  title: string;
  description?: string;
  path?: string;
  noIndex?: boolean;
}): Metadata {
  const desc = description ?? siteConfig.description;
  const normalizedPath = path.startsWith("/") || path === "" ? path : `/${path}`;
  const canonical = `${siteConfig.url}${normalizedPath}`;

  return {
    title: title.includes(siteConfig.shortName)
      ? title
      : `${title} | ${siteConfig.shortName}`,
    description: desc,
    metadataBase: new URL(siteConfig.url),
    alternates: { canonical },
    robots: noIndex ? { index: false, follow: true } : undefined,
    openGraph: {
      title,
      description: desc,
      url: canonical,
      siteName: siteConfig.name,
      type: "website",
      images: [
        {
          url: "/placeholders/og-image.svg",
          width: 1200,
          height: 630,
          alt: siteConfig.name,
        },
      ],
    },
  };
}
