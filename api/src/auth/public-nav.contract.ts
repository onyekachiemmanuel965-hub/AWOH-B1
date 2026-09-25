/**
 * Mirrors web/src/lib/public-nav.ts — public route contract for UX add-on tests.
 */
export const PUBLIC_NAV_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/products', label: 'Products' },
  { href: '/categories', label: 'Categories' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
] as const;

export const PUBLIC_UTILITY_LINKS = [
  { href: '/cart', label: 'Cart' },
  { href: '/account', label: 'Account' },
  { href: '/login', label: 'Sign in' },
  { href: '/register', label: 'Register' },
] as const;
