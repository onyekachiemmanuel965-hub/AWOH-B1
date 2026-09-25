import { securityHeadersMiddleware } from './security-headers.middleware';

describe('securityHeadersMiddleware', () => {
  function run(proto?: string, forceHsts?: string) {
    const prevForce = process.env.FORCE_HSTS;
    if (forceHsts !== undefined) process.env.FORCE_HSTS = forceHsts;
    else delete process.env.FORCE_HSTS;

    const headers: Record<string, string> = {};
    const res = {
      setHeader: (k: string, v: string) => {
        headers[k] = v;
      },
    };
    const req = {
      headers: proto ? { 'x-forwarded-proto': proto } : {},
      protocol: 'http',
    };
    const next = jest.fn();
    securityHeadersMiddleware(req as never, res as never, next);
    if (forceHsts !== undefined) {
      if (prevForce === undefined) delete process.env.FORCE_HSTS;
      else process.env.FORCE_HSTS = prevForce;
    } else if (prevForce !== undefined) {
      process.env.FORCE_HSTS = prevForce;
    }
    return { headers, next };
  }

  it('sets baseline security headers', () => {
    const { headers, next } = run();
    expect(headers['X-Content-Type-Options']).toBe('nosniff');
    expect(headers['X-Frame-Options']).toBe('DENY');
    expect(headers['Referrer-Policy']).toBe('strict-origin-when-cross-origin');
    expect(headers['Permissions-Policy']).toContain('camera=()');
    expect(headers['Strict-Transport-Security']).toBeUndefined();
    expect(next).toHaveBeenCalled();
  });

  it('sets HSTS when request is HTTPS', () => {
    const { headers } = run('https');
    expect(headers['Strict-Transport-Security']).toContain('max-age=');
  });

  it('sets HSTS when FORCE_HSTS=true', () => {
    const { headers } = run(undefined, 'true');
    expect(headers['Strict-Transport-Security']).toContain('includeSubDomains');
  });
});
