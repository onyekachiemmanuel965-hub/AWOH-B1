import { ForbiddenException } from '@nestjs/common';
import { OriginGuard } from './origin.guard';

describe('OriginGuard', () => {
  function guard(corsOrigin = 'http://localhost:3000') {
    return new OriginGuard({
      get: (key: string) => (key === 'CORS_ORIGIN' ? corsOrigin : undefined),
    } as never);
  }

  function ctx(method: string, headers: Record<string, string | undefined>) {
    return {
      switchToHttp: () => ({
        getRequest: () => ({ method, headers }),
      }),
    };
  }

  it('allows safe methods without origin checks', () => {
    expect(guard().canActivate(ctx('GET', {}) as never)).toBe(true);
    expect(guard().canActivate(ctx('OPTIONS', {}) as never)).toBe(true);
  });

  it('allows allowed Origin on mutating methods', () => {
    expect(
      guard().canActivate(
        ctx('POST', { origin: 'http://localhost:3000' }) as never,
      ),
    ).toBe(true);
  });

  it('rejects disallowed Origin', () => {
    expect(() =>
      guard().canActivate(
        ctx('POST', { origin: 'https://evil.example' }) as never,
      ),
    ).toThrow(ForbiddenException);
  });

  it('allows non-browser requests without Origin/Referer', () => {
    expect(guard().canActivate(ctx('POST', {}) as never)).toBe(true);
  });

  it('validates Referer origin when Origin is absent', () => {
    expect(
      guard().canActivate(
        ctx('POST', { referer: 'http://localhost:3000/checkout' }) as never,
      ),
    ).toBe(true);
    expect(() =>
      guard().canActivate(
        ctx('POST', { referer: 'https://evil.example/x' }) as never,
      ),
    ).toThrow(ForbiddenException);
  });
});
