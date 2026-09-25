import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { AuthUserPayload } from '../guards/jwt-auth.guard';

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthUserPayload => {
    const req = ctx.switchToHttp().getRequest<{ authUser?: AuthUserPayload }>();
    return req.authUser as AuthUserPayload;
  },
);
