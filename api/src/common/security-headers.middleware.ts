import type { NextFunction, Request, Response } from 'express';

/**
 * Stage 09 — baseline security headers (no external helmet dependency).
 * Safe for local + production; CSP kept intentionally permissive for MVP SPA/API split.
 */
export function securityHeadersMiddleware(
  _req: Request,
  res: Response,
  next: NextFunction,
) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), payment=()',
  );
  res.setHeader('X-DNS-Prefetch-Control', 'off');
  // HSTS only when the request is already HTTPS (or behind TLS-terminating proxy)
  const proto = String(
    _req.headers['x-forwarded-proto'] ?? _req.protocol ?? '',
  ).toLowerCase();
  if (proto.includes('https') || process.env.FORCE_HSTS === 'true') {
    res.setHeader(
      'Strict-Transport-Security',
      'max-age=15552000; includeSubDomains',
    );
  }
  next();
}
