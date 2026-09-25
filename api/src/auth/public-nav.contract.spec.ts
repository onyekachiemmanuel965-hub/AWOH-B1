import {
  PUBLIC_NAV_LINKS,
  PUBLIC_UTILITY_LINKS,
} from './public-nav.contract';
import { resolvePostLoginPath } from './post-login-destination';

describe('public navigation contract (customer UX add-on)', () => {
  it('exposes dedicated public routes (not homepage anchors)', () => {
    const hrefs = PUBLIC_NAV_LINKS.map((l) => l.href);
    expect(hrefs).toEqual([
      '/',
      '/products',
      '/categories',
      '/about',
      '/contact',
    ]);
    for (const href of hrefs) {
      expect(href.includes('#')).toBe(false);
    }
  });

  it('keeps cart, account, login, and register as utility routes', () => {
    const hrefs = PUBLIC_UTILITY_LINKS.map((l) => l.href);
    expect(hrefs).toContain('/cart');
    expect(hrefs).toContain('/account');
    expect(hrefs).toContain('/login');
    expect(hrefs).toContain('/register');
  });

  it('customer login defaults to welcome (not account)', () => {
    expect(resolvePostLoginPath('CUSTOMER')).toBe('/welcome');
  });

  it('staff login still defaults to admin workspace', () => {
    expect(resolvePostLoginPath('ADMIN')).toBe('/admin');
    expect(resolvePostLoginPath('SALES_STAFF')).toBe('/admin');
  });
});
