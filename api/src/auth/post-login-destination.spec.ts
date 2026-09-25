import { resolvePostLoginPath } from './post-login-destination';

describe('resolvePostLoginPath (post-login routing contract)', () => {
  it('sends ADMIN to /admin when no next param', () => {
    expect(resolvePostLoginPath('ADMIN', null)).toBe('/admin');
    expect(resolvePostLoginPath('ADMIN', undefined)).toBe('/admin');
  });

  it('does not treat default /account or /welcome as staff destination', () => {
    expect(resolvePostLoginPath('ADMIN', '/account')).toBe('/admin');
    expect(resolvePostLoginPath('ADMIN', '/welcome')).toBe('/admin');
  });

  it('sends other staff roles to /admin', () => {
    expect(resolvePostLoginPath('SALES_STAFF', null)).toBe('/admin');
    expect(resolvePostLoginPath('INVENTORY_MANAGER', null)).toBe('/admin');
    expect(resolvePostLoginPath('CONTENT_MANAGER', null)).toBe('/admin');
  });

  it('honors explicit /admin deep links for staff', () => {
    expect(resolvePostLoginPath('ADMIN', '/admin/staff')).toBe('/admin/staff');
  });

  it('honors explicit non-account next for staff (e.g. checkout)', () => {
    expect(resolvePostLoginPath('SALES_STAFF', '/checkout')).toBe('/checkout');
  });

  it('sends CUSTOMER to /welcome by default (not /account)', () => {
    expect(resolvePostLoginPath('CUSTOMER', null)).toBe('/welcome');
    expect(resolvePostLoginPath('CUSTOMER', undefined)).toBe('/welcome');
  });

  it('honors CUSTOMER next when not /admin', () => {
    expect(resolvePostLoginPath('CUSTOMER', '/checkout')).toBe('/checkout');
    expect(resolvePostLoginPath('CUSTOMER', '/account/orders')).toBe(
      '/account/orders',
    );
    expect(resolvePostLoginPath('CUSTOMER', '/account')).toBe('/account');
  });

  it('never redirects CUSTOMER to /admin via this helper', () => {
    expect(resolvePostLoginPath('CUSTOMER', '/admin')).toBe('/welcome');
    expect(resolvePostLoginPath('CUSTOMER', '/admin/staff')).toBe('/welcome');
  });

  it('rejects protocol-relative next paths', () => {
    expect(resolvePostLoginPath('ADMIN', '//evil.example')).toBe('/admin');
    expect(resolvePostLoginPath('CUSTOMER', '//evil.example')).toBe(
      '/welcome',
    );
  });
});
