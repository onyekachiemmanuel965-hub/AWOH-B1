/**
 * Static presentation data for Stage 03 landing only.
 * Homepage editorial copy only. Live catalog data comes from the API
 * (FeaturedCollection / CategoryDiscovery). Do not treat this file as catalog.
 */

export const homeCategories = [
  {
    id: "tiles",
    name: "Tiles",
    phrase: "Surfaces with precision and presence",
    href: "#collections",
    imageSrc: "/images/placeholders/category-tiles.svg",
    imageAlt: "Placeholder visual for architectural tile surfaces",
  },
  {
    id: "marble",
    name: "Marble Looks",
    phrase: "Refined stone-inspired character",
    href: "#collections",
    imageSrc: "/images/placeholders/category-marble.svg",
    imageAlt: "Placeholder visual for marble-look materials",
  },
  {
    id: "finishing",
    name: "Finishing Materials",
    phrase: "Details that complete the space",
    href: "#collections",
    imageSrc: "/images/placeholders/category-finishing.svg",
    imageAlt: "Placeholder visual for finishing materials",
  },
  {
    id: "surfaces",
    name: "Architectural Surfaces",
    phrase: "Materials for floors, walls, and form",
    href: "#collections",
    imageSrc: "/images/placeholders/category-surfaces.svg",
    imageAlt: "Placeholder visual for architectural surfaces",
  },
] as const;

/** Demo products — names/prices are placeholders, not real AWOH-B catalog data. */
export const featuredDemoProducts = [
  {
    id: "demo-1",
    name: "Demo Surface A",
    category: "Tiles",
    subcategory: "Example collection",
    priceLabel: "Price · placeholder",
    imageSrc: "/images/placeholders/product-a.svg",
    imageAlt: "Placeholder product imagery for Demo Surface A",
    badge: "featured" as const,
    availability: "available" as const,
  },
  {
    id: "demo-2",
    name: "Demo Surface B",
    category: "Tiles",
    subcategory: "Example collection",
    priceLabel: "Price · placeholder",
    imageSrc: "/images/placeholders/product-b.svg",
    imageAlt: "Placeholder product imagery for Demo Surface B",
    badge: "new" as const,
    availability: "available" as const,
  },
  {
    id: "demo-3",
    name: "Demo Surface C",
    category: "Surfaces",
    subcategory: "Example collection",
    priceLabel: "Price · placeholder",
    imageSrc: "/images/placeholders/product-c.svg",
    imageAlt: "Placeholder product imagery for Demo Surface C",
    availability: "available" as const,
  },
] as const;

export const inspirationItems = [
  {
    id: "insp-1",
    title: "Calm interiors",
    caption: "Quiet material rhythm for considered rooms",
    imageSrc: "/images/placeholders/inspire-interior.svg",
    imageAlt: "Placeholder image suggesting a calm modern interior",
    span: "wide" as const,
  },
  {
    id: "insp-2",
    title: "Surface detail",
    caption: "Texture, edge, and finish up close",
    imageSrc: "/images/placeholders/inspire-detail.svg",
    imageAlt: "Placeholder close-up of material surface detail",
    span: "tall" as const,
  },
  {
    id: "insp-3",
    title: "Architectural lines",
    caption: "Geometry that shapes the room",
    imageSrc: "/images/placeholders/inspire-architecture.svg",
    imageAlt: "Placeholder architectural interior composition",
    span: "standard" as const,
  },
  {
    id: "insp-4",
    title: "Light on finish",
    caption: "How light reveals material character",
    imageSrc: "/images/placeholders/inspire-light.svg",
    imageAlt: "Placeholder scene emphasizing light on surfaces",
    span: "standard" as const,
  },
] as const;

export const whyPoints = [
  {
    title: "Quality",
    body: "Materials selected with attention to quality and finish — so spaces feel considered from the surface up.",
  },
  {
    title: "Timeless Design",
    body: "Architectural materials intended to complement interiors and exteriors with lasting visual character.",
  },
  {
    title: "Professional Service",
    body: "A customer-focused approach for homeowners, builders, contractors, architects, and businesses.",
  },
  {
    title: "Convenient Purchasing",
    body: "A purchasing experience designed for clarity — with online and offline options as the platform grows.",
  },
] as const;
