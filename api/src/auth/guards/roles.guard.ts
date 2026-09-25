import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../prisma/prisma.service';
import { ROLE_CODES, RoleCode } from '../auth.constants';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles =
      this.reflector.getAllAndOverride<RoleCode[]>(ROLES_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) ?? [];
    const requiredPermissions =
      this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) ?? [];

    if (requiredRoles.length === 0 && requiredPermissions.length === 0) {
      return true;
    }

    const req = context.switchToHttp().getRequest<{
      authUser?: { userId: string; role: string };
    }>();
    if (!req.authUser?.userId) {
      throw new UnauthorizedException('Authentication required.');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: req.authUser.userId },
      include: {
        role: {
          include: { permissions: { include: { permission: true } } },
        },
      },
    });

    if (!user || user.status !== 'ACTIVE') {
      throw new UnauthorizedException('Authentication required.');
    }

    const roleCode = user.role.code as RoleCode;
    const permissionCodes = user.role.permissions.map((p) => p.permission.code);

    if (roleCode === ROLE_CODES.ADMIN) {
      return true;
    }

    if (requiredRoles.length > 0 && !requiredRoles.includes(roleCode)) {
      throw new ForbiddenException('Insufficient permissions.');
    }

    if (requiredPermissions.length > 0) {
      const ok = requiredPermissions.every((p) => permissionCodes.includes(p));
      if (!ok) {
        throw new ForbiddenException('Insufficient permissions.');
      }
    }

    return true;
  }
}
