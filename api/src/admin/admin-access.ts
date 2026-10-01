import { ROLE_CODES } from '../auth/auth.constants';

/**
 * User-facing admin modules derived from Stage 08 controller @Roles.
 * Frontend UX only — RolesGuard + permissions remain authoritative.
 */
export type AdminAccessModule = {
  key: string;
  label: string;
  href: string;
};

const DASHBOARD: AdminAccessModule = {
  key: 'dashboard',
  label: 'Dashboard',
  href: '/admin/dashboard',
};
const PRODUCTS: AdminAccessModule = {
  key: 'products',
  label: 'Products',
  href: '/admin/products',
};
const CATEGORIES: AdminAccessModule = {
  key: 'categories',
  label: 'Categories',
  href: '/admin/categories',
};
const SUBCATEGORIES: AdminAccessModule = {
  key: 'subcategories',
  label: 'Subcategories',
  href: '/admin/subcategories',
};
const INVENTORY: AdminAccessModule = {
  key: 'inventory',
  label: 'Inventory',
  href: '/admin/inventory',
};
const ORDERS: AdminAccessModule = {
  key: 'orders',
  label: 'Orders',
  href: '/admin/orders',
};
const DELIVERY: AdminAccessModule = {
  key: 'delivery',
  label: 'Delivery',
  href: '/admin/delivery',
};
const STAFF: AdminAccessModule = {
  key: 'staff',
  label: 'Staff',
  href: '/admin/staff',
};
const PAYMENTS: AdminAccessModule = {
  key: 'payments',
  label: 'Payments',
  href: '/admin/payments',
};
const AUDIT: AdminAccessModule = {
  key: 'audit',
  label: 'Audit',
  href: '/admin/audit',
};
const CMS: AdminAccessModule = {
  key: 'cms',
  label: 'CMS',
  href: '/admin/cms',
};

/** Full CMS module catalog (for “restricted” summaries). */
export const ALL_ADMIN_MODULES: AdminAccessModule[] = [
  DASHBOARD,
  PRODUCTS,
  CATEGORIES,
  SUBCATEGORIES,
  INVENTORY,
  ORDERS,
  DELIVERY,
  STAFF,
  PAYMENTS,
  AUDIT,
  CMS,
];

/**
 * Role → workspace modules (AO Solid Base-style operational structure).
 * Must stay aligned with controller @Roles / permission matrix.
 */
const MODULES_BY_ROLE: Record<string, AdminAccessModule[]> = {
  [ROLE_CODES.ADMIN]: [
    DASHBOARD,
    PRODUCTS,
    CATEGORIES,
    SUBCATEGORIES,
    INVENTORY,
    ORDERS,
    DELIVERY,
    STAFF,
    PAYMENTS,
    AUDIT,
    CMS,
  ],
  [ROLE_CODES.SALES_STAFF]: [DASHBOARD, ORDERS, DELIVERY, PAYMENTS],
  [ROLE_CODES.INVENTORY_MANAGER]: [DASHBOARD, PRODUCTS, INVENTORY],
  [ROLE_CODES.CONTENT_MANAGER]: [
    DASHBOARD,
    PRODUCTS,
    CATEGORIES,
    SUBCATEGORIES,
    CMS,
  ],
};

export const ROLE_DISPLAY_LABELS: Record<string, string> = {
  [ROLE_CODES.ADMIN]: 'Administrator',
  [ROLE_CODES.SALES_STAFF]: 'Sales Staff',
  [ROLE_CODES.INVENTORY_MANAGER]: 'Inventory Manager',
  [ROLE_CODES.CONTENT_MANAGER]: 'Content Manager',
  [ROLE_CODES.CUSTOMER]: 'Customer',
};

export function modulesForRole(roleCode: string): AdminAccessModule[] {
  return MODULES_BY_ROLE[roleCode] ?? [];
}

export function roleDisplayLabel(roleCode: string): string {
  return ROLE_DISPLAY_LABELS[roleCode] ?? roleCode;
}

/** Unique nav entries by href (stable order from modulesForRole). */
export function navModulesForRole(roleCode: string): AdminAccessModule[] {
  const seen = new Set<string>();
  const out: AdminAccessModule[] = [];
  for (const m of modulesForRole(roleCode)) {
    if (seen.has(m.href)) continue;
    seen.add(m.href);
    out.push(m);
  }
  return out;
}

export function restrictedModulesForRole(
  roleCode: string,
): AdminAccessModule[] {
  const allowed = new Set(modulesForRole(roleCode).map((m) => m.key));
  return ALL_ADMIN_MODULES.filter((m) => !allowed.has(m.key));
}

/**
 * Whether a staff role’s workspace may display this admin path.
 * Backend RolesGuard remains authoritative for APIs.
 */
export function canAccessAdminPath(
  roleCode: string,
  pathname: string,
): boolean {
  if (!pathname.startsWith('/admin')) return false;
  if (roleCode === ROLE_CODES.CUSTOMER) return false;
  const modules = modulesForRole(roleCode);
  if (modules.length === 0) return false;

  const normalized =
    pathname.length > 1 && pathname.endsWith('/')
      ? pathname.slice(0, -1)
      : pathname;

  if (normalized === '/admin') return true;

  const prefixes = [...modules.map((m) => m.href)].sort(
    (a, b) => b.length - a.length,
  );
  return prefixes.some(
    (href) => normalized === href || normalized.startsWith(`${href}/`),
  );
}
