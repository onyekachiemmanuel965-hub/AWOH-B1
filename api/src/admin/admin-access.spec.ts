import {
  canAccessAdminPath,
  modulesForRole,
  roleDisplayLabel,
  navModulesForRole,
  restrictedModulesForRole,
} from './admin-access';
import { ROLE_CODES } from '../auth/auth.constants';

describe('admin-access module mapping (role workspaces)', () => {
  it('maps ADMIN to full operational CMS modules', () => {
    const labels = modulesForRole(ROLE_CODES.ADMIN).map((m) => m.label);
    expect(labels).toEqual([
      'Dashboard',
      'Products',
      'Categories',
      'Subcategories',
      'Inventory',
      'Orders',
      'Delivery',
      'Staff',
      'Payments',
      'Audit',
      'CMS',
    ]);
    expect(roleDisplayLabel(ROLE_CODES.ADMIN)).toBe('Administrator');
  });

  it('maps SALES_STAFF to orders/delivery/payments only', () => {
    const labels = modulesForRole(ROLE_CODES.SALES_STAFF).map((m) => m.label);
    expect(labels).toEqual(['Dashboard', 'Orders', 'Delivery', 'Payments']);
    expect(labels).not.toContain('Staff');
    expect(labels).not.toContain('Audit');
    expect(labels).not.toContain('Inventory');
    expect(labels).not.toContain('Products');
    expect(labels).not.toContain('Categories');
    expect(labels).not.toContain('CMS');
  });

  it('maps INVENTORY_MANAGER without delivery/staff/payments/cms', () => {
    const labels = modulesForRole(ROLE_CODES.INVENTORY_MANAGER).map(
      (m) => m.label,
    );
    expect(labels).toEqual(['Dashboard', 'Products', 'Inventory']);
    expect(labels).not.toContain('Delivery');
    expect(labels).not.toContain('Staff');
    expect(labels).not.toContain('Payments');
    expect(labels).not.toContain('CMS');
  });

  it('maps CONTENT_MANAGER to catalog + CMS', () => {
    const labels = modulesForRole(ROLE_CODES.CONTENT_MANAGER).map(
      (m) => m.label,
    );
    expect(labels).toEqual([
      'Dashboard',
      'Products',
      'Categories',
      'Subcategories',
      'CMS',
    ]);
    expect(labels).not.toContain('Orders');
    expect(labels).not.toContain('Delivery');
    expect(labels).not.toContain('Inventory');
  });

  it('CUSTOMER has empty modules', () => {
    expect(modulesForRole(ROLE_CODES.CUSTOMER)).toEqual([]);
  });

  it('nav keeps Delivery as its own href', () => {
    const nav = navModulesForRole(ROLE_CODES.SALES_STAFF);
    expect(nav.map((m) => m.href)).toEqual([
      '/admin/dashboard',
      '/admin/orders',
      '/admin/delivery',
      '/admin/payments',
    ]);
  });

  it('restrictedModulesForRole lists modules outside the workspace', () => {
    const restricted = restrictedModulesForRole(ROLE_CODES.SALES_STAFF).map(
      (m) => m.label,
    );
    expect(restricted).toEqual(
      expect.arrayContaining([
        'Products',
        'Inventory',
        'Categories',
        'Staff',
        'Audit',
        'CMS',
      ]),
    );
    expect(restricted).not.toContain('Orders');
  });

  it('canAccessAdminPath enforces workspace boundaries', () => {
    expect(canAccessAdminPath(ROLE_CODES.SALES_STAFF, '/admin')).toBe(true);
    expect(canAccessAdminPath(ROLE_CODES.SALES_STAFF, '/admin/orders')).toBe(
      true,
    );
    expect(canAccessAdminPath(ROLE_CODES.SALES_STAFF, '/admin/delivery')).toBe(
      true,
    );
    expect(canAccessAdminPath(ROLE_CODES.SALES_STAFF, '/admin/payments')).toBe(
      true,
    );
    expect(
      canAccessAdminPath(ROLE_CODES.SALES_STAFF, '/admin/inventory'),
    ).toBe(false);
    expect(canAccessAdminPath(ROLE_CODES.SALES_STAFF, '/admin/staff')).toBe(
      false,
    );
    expect(
      canAccessAdminPath(ROLE_CODES.SALES_STAFF, '/admin/categories'),
    ).toBe(false);
    expect(
      canAccessAdminPath(ROLE_CODES.CONTENT_MANAGER, '/admin/staff'),
    ).toBe(false);
    expect(
      canAccessAdminPath(ROLE_CODES.INVENTORY_MANAGER, '/admin/delivery'),
    ).toBe(false);
    expect(canAccessAdminPath(ROLE_CODES.CUSTOMER, '/admin')).toBe(false);
    expect(canAccessAdminPath(ROLE_CODES.ADMIN, '/admin/cms')).toBe(true);
  });
});
