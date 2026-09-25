import { modulesForRole, roleDisplayLabel, navModulesForRole } from './admin-access';
import { ROLE_CODES } from '../auth/auth.constants';

describe('admin-access module mapping', () => {
  it('maps ADMIN to staff + audit modules', () => {
    const labels = modulesForRole(ROLE_CODES.ADMIN).map((m) => m.label);
    expect(labels).toEqual(
      expect.arrayContaining([
        'Dashboard',
        'Orders',
        'Delivery',
        'Products',
        'Categories',
        'Inventory',
        'Staff',
        'Audit',
      ]),
    );
    expect(roleDisplayLabel(ROLE_CODES.ADMIN)).toBe('Administrator');
  });

  it('maps SALES_STAFF without Staff/Audit/Inventory', () => {
    const labels = modulesForRole(ROLE_CODES.SALES_STAFF).map((m) => m.label);
    expect(labels).toEqual(
      expect.arrayContaining(['Dashboard', 'Orders', 'Delivery', 'Products']),
    );
    expect(labels).not.toContain('Staff');
    expect(labels).not.toContain('Audit');
    expect(labels).not.toContain('Inventory');
  });

  it('maps INVENTORY_MANAGER to inventory + orders', () => {
    const labels = modulesForRole(ROLE_CODES.INVENTORY_MANAGER).map(
      (m) => m.label,
    );
    expect(labels).toEqual(
      expect.arrayContaining([
        'Dashboard',
        'Orders',
        'Products',
        'Inventory',
      ]),
    );
    expect(labels).not.toContain('Staff');
  });

  it('maps CONTENT_MANAGER to catalog modules', () => {
    const labels = modulesForRole(ROLE_CODES.CONTENT_MANAGER).map(
      (m) => m.label,
    );
    expect(labels).toEqual(
      expect.arrayContaining([
        'Dashboard',
        'Products',
        'Categories',
        'Subcategories',
      ]),
    );
    expect(labels).not.toContain('Orders');
  });

  it('CUSTOMER has empty modules', () => {
    expect(modulesForRole(ROLE_CODES.CUSTOMER)).toEqual([]);
  });

  it('nav dedupes Delivery onto Orders href', () => {
    const nav = navModulesForRole(ROLE_CODES.SALES_STAFF);
    const hrefs = nav.map((m) => m.href);
    expect(hrefs.filter((h) => h === '/admin/orders')).toHaveLength(1);
  });
});
