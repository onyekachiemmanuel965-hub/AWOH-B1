import type { CookieOptions, Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { ACCESS_COOKIE, REFRESH_COOKIE } from './auth.constants';
import type { AuthTokens } from './auth.service';

export function cookieOptions(
  config: ConfigService,
  maxAgeSec: number,
): CookieOptions {
  const isProd = config.get<string>('NODE_ENV') === 'production';
  const sameSiteEnv = (config.get<string>('COOKIE_SAMESITE') ?? 'lax').toLowerCase();
  const sameSite =
    sameSiteEnv === 'none' || sameSiteEnv === 'strict' || sameSiteEnv === 'lax'
      ? sameSiteEnv
      : 'lax';

  return {
    httpOnly: true,
    secure: isProd || config.get<string>('COOKIE_SECURE') === 'true',
    sameSite,
    path: '/',
    maxAge: maxAgeSec * 1000,
  };
}

export function setAuthCookies(
  res: Response,
  tokens: AuthTokens,
  config: ConfigService,
) {
  res.cookie(
    ACCESS_COOKIE,
    tokens.accessToken,
    cookieOptions(config, tokens.accessMaxAgeSec),
  );
  res.cookie(
    REFRESH_COOKIE,
    tokens.refreshToken,
    cookieOptions(config, tokens.refreshMaxAgeSec),
  );
}

export function clearAuthCookies(res: Response, config: ConfigService) {
  const base = cookieOptions(config, 0);
  res.clearCookie(ACCESS_COOKIE, { ...base, maxAge: 0 });
  res.clearCookie(REFRESH_COOKIE, { ...base, maxAge: 0 });
}
