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
const ORDERS: AdminAccessModule = {
  key: 'orders',
  label: 'Orders',
  href: '/admin/orders',
};
const DELIVERY: AdminAccessModule = {
  key: 'delivery',
  label: 'Delivery',
  href: '/admin/orders',
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
const STAFF: AdminAccessModule = {
  key: 'staff',
  label: 'Staff',
  href: '/admin/staff',
};
const AUDIT: AdminAccessModule = {
  key: 'audit',
  label: 'Audit',
  href: '/admin/audit',
};

/** Module lists aligned with existing Stage 08 admin route guards. */
const MODULES_BY_ROLE: Record<string, AdminAccessModule[]> = {
  [ROLE_CODES.ADMIN]: [
    DASHBOARD,
    ORDERS,
    DELIVERY,
    PRODUCTS,
    CATEGORIES,
    SUBCATEGORIES,
    INVENTORY,
    STAFF,
    AUDIT,
  ],
  [ROLE_CODES.SALES_STAFF]: [DASHBOARD, ORDERS, DELIVERY, PRODUCTS],
  [ROLE_CODES.INVENTORY_MANAGER]: [
    DASHBOARD,
    ORDERS,
    PRODUCTS,
    INVENTORY,
  ],
  [ROLE_CODES.CONTENT_MANAGER]: [
    DASHBOARD,
    PRODUCTS,
    CATEGORIES,
    SUBCATEGORIES,
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

/** Unique nav entries (Delivery shares Orders href — show Orders once in nav). */
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
