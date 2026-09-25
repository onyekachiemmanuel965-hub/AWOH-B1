import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';

/**
 * Origin check for credentialed cookie mutations (CSRF mitigation).
 * Complements SameSite cookie policy. Documented in STAGE_05_REVIEW.
 */
@Injectable()
export class OriginGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    const method = req.method.toUpperCase();
    if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') {
      return true;
    }

    const allowed = (this.config.get<string>('CORS_ORIGIN') ?? 'http://localhost:3000')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const origin = req.headers.origin;
    const referer = req.headers.referer;

    if (origin) {
      if (!allowed.includes(origin)) {
        throw new ForbiddenException('Invalid request origin.');
      }
      return true;
    }

    // Same-origin tools / curl without Origin: allow when no Origin (non-browser)
    // For browsers, Origin is typically present on cross-origin credentialed POSTs.
    if (!origin && !referer) {
      return true;
    }

    if (referer) {
      try {
        const refOrigin = new URL(referer).origin;
        if (!allowed.includes(refOrigin)) {
          throw new ForbiddenException('Invalid request origin.');
        }
        return true;
      } catch {
        throw new ForbiddenException('Invalid request origin.');
      }
    }

    return true;
  }
}
