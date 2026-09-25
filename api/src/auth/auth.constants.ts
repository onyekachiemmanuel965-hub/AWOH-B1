export const ROLE_CODES = {
  ADMIN: 'ADMIN',
  INVENTORY_MANAGER: 'INVENTORY_MANAGER',
  SALES_STAFF: 'SALES_STAFF',
  CONTENT_MANAGER: 'CONTENT_MANAGER',
  CUSTOMER: 'CUSTOMER',
} as const;

export type RoleCode = (typeof ROLE_CODES)[keyof typeof ROLE_CODES];

export const STAFF_ROLES: RoleCode[] = [
  ROLE_CODES.ADMIN,
  ROLE_CODES.INVENTORY_MANAGER,
  ROLE_CODES.SALES_STAFF,
  ROLE_CODES.CONTENT_MANAGER,
];

/** Minimum permission codes seeded for RBAC. */
export const PERMISSION_CODES = [
  'users.read',
  'users.manage',
  'products.read',
  'products.manage',
  'inventory.read',
  'inventory.manage',
  'orders.read',
  'orders.manage',
  'content.manage',
  'payments.read',
  'account.read',
  'delivery.read',
  'delivery.manage',
  'audit.read',
] as const;

export type PermissionCode = (typeof PERMISSION_CODES)[number];

export const ACCESS_COOKIE = 'awoh_access';
export const REFRESH_COOKIE = 'awoh_refresh';
