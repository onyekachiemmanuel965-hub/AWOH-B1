/**
 * Stable storefront image slots for Content Manager / Admin CMS.
 * Placeholders live on the web app; uploaded files under /uploads/content/.
 */

export type StorefrontImageSlot = {
  key: string;
  page: string;
  label: string;
  description: string;
  /** Built-in web placeholder path (public/) when no upload exists */
  placeholderPath: string;
  placeholderAlt: string;
};

export const STOREFRONT_IMAGE_SLOTS: StorefrontImageSlot[] = [
  {
    key: 'home.hero',
    page: 'home',
    label: 'Homepage hero',
    description: 'Full-bleed hero image on the storefront home page.',
    placeholderPath: '/images/placeholders/hero-surface.svg',
    placeholderAlt:
      'Architectural surface placeholder representing premium tile materials',
  },
  {
    key: 'home.inspire.1',
    page: 'home',
    label: 'Inspiration — Calm interiors',
    description: 'First inspiration gallery tile on the home page.',
    placeholderPath: '/images/placeholders/inspire-interior.svg',
    placeholderAlt: 'Placeholder image suggesting a calm modern interior',
  },
  {
    key: 'home.inspire.2',
    page: 'home',
    label: 'Inspiration — Surface detail',
    description: 'Second inspiration gallery tile on the home page.',
    placeholderPath: '/images/placeholders/inspire-detail.svg',
    placeholderAlt: 'Placeholder close-up of material surface detail',
  },
  {
    key: 'home.inspire.3',
    page: 'home',
    label: 'Inspiration — Architectural lines',
    description: 'Third inspiration gallery tile on the home page.',
    placeholderPath: '/images/placeholders/inspire-architecture.svg',
    placeholderAlt: 'Placeholder architectural interior composition',
  },
  {
    key: 'home.inspire.4',
    page: 'home',
    label: 'Inspiration — Light on finish',
    description: 'Fourth inspiration gallery tile on the home page.',
    placeholderPath: '/images/placeholders/inspire-light.svg',
    placeholderAlt: 'Placeholder scene emphasizing light on surfaces',
  },
  {
    key: 'about.hero',
    page: 'about',
    label: 'About page banner',
    description: 'Optional banner image at the top of the About page.',
    placeholderPath: '/images/placeholders/category-surfaces.svg',
    placeholderAlt: 'About page materials atmosphere',
  },
  {
    key: 'contact.hero',
    page: 'contact',
    label: 'Contact page banner',
    description: 'Optional banner image at the top of the Contact page.',
    placeholderPath: '/images/placeholders/category-finishing.svg',
    placeholderAlt: 'Contact page atmosphere',
  },
  {
    key: 'products.hero',
    page: 'products',
    label: 'Products page banner',
    description: 'Optional banner image on the Products listing page.',
    placeholderPath: '/images/placeholders/category-tiles.svg',
    placeholderAlt: 'Products collection atmosphere',
  },
  {
    key: 'categories.hero',
    page: 'categories',
    label: 'Categories page banner',
    description: 'Optional banner image on the Categories page.',
    placeholderPath: '/images/placeholders/category-marble.svg',
    placeholderAlt: 'Categories discovery atmosphere',
  },
];

export const STOREFRONT_IMAGE_KEY_SET = new Set(
  STOREFRONT_IMAGE_SLOTS.map((s) => s.key),
);

export function getStorefrontSlot(key: string) {
  return STOREFRONT_IMAGE_SLOTS.find((s) => s.key === key) ?? null;
}
