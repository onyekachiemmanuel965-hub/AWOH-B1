import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import { ACCESS_COOKIE } from '../auth.constants';

export type AuthUserPayload = {
  userId: string;
  role: string;
};

declare global {
  namespace Express {
    interface Request {
      authUser?: AuthUserPayload;
    }
  }
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    const token = this.extractToken(req);
    if (!token) {
      throw new UnauthorizedException('Authentication required.');
    }
    try {
      const payload = this.jwt.verify<{ sub: string; role: string }>(token, {
        secret: this.config.get<string>('JWT_ACCESS_SECRET'),
      });
      if (!payload?.sub || !payload?.role) {
        throw new UnauthorizedException('Authentication required.');
      }
      req.authUser = { userId: payload.sub, role: payload.role };
      return true;
    } catch {
      throw new UnauthorizedException('Authentication required.');
    }
  }

  private extractToken(req: Request): string | undefined {
    const cookie = req.cookies?.[ACCESS_COOKIE];
    if (typeof cookie === 'string' && cookie.length > 0) return cookie;
    const header = req.headers.authorization;
    if (header?.startsWith('Bearer ')) {
      return header.slice(7);
    }
    return undefined;
  }
}
