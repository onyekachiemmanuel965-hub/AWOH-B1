import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { UserStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { ROLE_CODES } from '../auth/auth.constants';
import {
  StaffListQueryDto,
  UpdateStaffRoleDto,
  UpdateStaffStatusDto,
} from './dto/admin.dto';
import {
  modulesForRole,
  navModulesForRole,
  restrictedModulesForRole,
  roleDisplayLabel,
  type AdminAccessModule,
} from './admin-access';

const ASSIGNABLE_ROLES = new Set<string>(Object.values(ROLE_CODES));

export type StaffUserDto = {
  id: string;
  firstName: string;
  lastName: string;
  name: string;
  email: string;
  role: string;
  roleLabel: string;
  status: UserStatus;
  isActive: boolean;
  createdAt: string;
  access: AdminAccessModule[];
  accessLabels: string[];
};

export type MyAccessDto = {
  role: string;
  roleLabel: string;
  isActive: boolean;
  firstName: string;
  lastName: string;
  modules: AdminAccessModule[];
  nav: AdminAccessModule[];
  /** Permission codes from the authenticated role (informational). */
  permissions: string[];
  allowedLabels: string[];
  restrictedLabels: string[];
};

@Injectable()
export class AdminStaffService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async getMyAccess(userId: string): Promise<MyAccessDto> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        role: {
          include: { permissions: { include: { permission: true } } },
        },
      },
    });
    if (!user || user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('Authentication required.');
    }
    if (user.role.code === ROLE_CODES.CUSTOMER) {
      throw new ForbiddenException('Insufficient permissions.');
    }
    const modules = modulesForRole(user.role.code);
    const restricted = restrictedModulesForRole(user.role.code);
    const permissions = user.role.permissions.map((rp) => rp.permission.code);
    return {
      role: user.role.code,
      roleLabel: roleDisplayLabel(user.role.code),
      isActive: true,
      firstName: user.firstName,
      lastName: user.lastName,
      modules,
      nav: navModulesForRole(user.role.code),
      permissions,
      allowedLabels: modules.map((m) => m.label),
      restrictedLabels: restricted.map((m) => m.label),
    };
  }

  async list(query: StaffListQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where: {
      OR?: Array<Record<string, unknown>>;
      status?: UserStatus;
      role?: { code: string };
    } = {};

    if (query.q?.trim()) {
      const q = query.q.trim();
      where.OR = [
        { email: { contains: q } },
        { firstName: { contains: q } },
        { lastName: { contains: q } },
      ];
    }
    if (query.status) where.status = query.status;
    if (query.role) where.role = { code: query.role };

    const [total, rows] = await this.prisma.$transaction([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        include: { role: true },
        orderBy: [{ createdAt: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return {
      data: rows.map((u) => this.toDto(u)),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  }

  async updateRole(
    actorUserId: string,
    targetUserId: string,
    dto: UpdateStaffRoleDto,
    ip?: string,
  ) {
    if (!ASSIGNABLE_ROLES.has(dto.role)) {
      throw new BadRequestException('Invalid role.');
    }
    if (actorUserId === targetUserId) {
      throw new ForbiddenException(
        'You cannot change your own role. Ask another administrator.',
      );
    }

    const target = await this.prisma.user.findUnique({
      where: { id: targetUserId },
      include: { role: true },
    });
    if (!target) throw new NotFoundException('User not found.');

    const previousRole = target.role.code;
    if (previousRole === dto.role) {
      return this.toDto(target);
    }

    if (previousRole === ROLE_CODES.ADMIN && dto.role !== ROLE_CODES.ADMIN) {
      await this.assertNotLastActiveAdmin(targetUserId);
    }

    const newRole = await this.prisma.role.findUnique({
      where: { code: dto.role },
    });
    if (!newRole) throw new BadRequestException('Invalid role.');

    const updated = await this.prisma.user.update({
      where: { id: targetUserId },
      data: { roleId: newRole.id },
      include: { role: true },
    });

    await this.revokeRefreshSessions(targetUserId);

    await this.audit.log({
      actorUserId,
      action: 'staff.role_changed',
      entityType: 'User',
      entityId: targetUserId,
      metadata: {
        previousRole,
        newRole: dto.role,
        targetEmail: target.email,
      },
      ip,
    });

    return this.toDto(updated);
  }

  async updateStatus(
    actorUserId: string,
    targetUserId: string,
    dto: UpdateStaffStatusDto,
    ip?: string,
  ) {
    if (actorUserId === targetUserId) {
      throw new ForbiddenException(
        'You cannot deactivate or change your own account status.',
      );
    }

    const target = await this.prisma.user.findUnique({
      where: { id: targetUserId },
      include: { role: true },
    });
    if (!target) throw new NotFoundException('User not found.');

    const nextStatus = dto.isActive ? UserStatus.ACTIVE : UserStatus.DISABLED;
    const previousStatus = target.status;
    if (previousStatus === nextStatus) {
      return this.toDto(target);
    }

    if (
      !dto.isActive &&
      target.role.code === ROLE_CODES.ADMIN &&
      previousStatus === UserStatus.ACTIVE
    ) {
      await this.assertNotLastActiveAdmin(targetUserId);
    }

    const updated = await this.prisma.user.update({
      where: { id: targetUserId },
      data: { status: nextStatus },
      include: { role: true },
    });

    if (!dto.isActive) {
      await this.revokeRefreshSessions(targetUserId);
    }

    await this.audit.log({
      actorUserId,
      action: dto.isActive
        ? 'staff.user_reactivated'
        : 'staff.user_deactivated',
      entityType: 'User',
      entityId: targetUserId,
      metadata: {
        previousStatus,
        newStatus: nextStatus,
        isActive: dto.isActive,
        targetEmail: target.email,
        role: target.role.code,
      },
      ip,
    });

    return this.toDto(updated);
  }

  private async assertNotLastActiveAdmin(excludeUserId: string) {
    const otherActiveAdmins = await this.prisma.user.count({
      where: {
        id: { not: excludeUserId },
        status: UserStatus.ACTIVE,
        role: { code: ROLE_CODES.ADMIN },
      },
    });
    if (otherActiveAdmins < 1) {
      throw new BadRequestException(
        'Cannot remove or deactivate the last active administrator.',
      );
    }
  }

  private async revokeRefreshSessions(userId: string) {
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  private toDto(user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    status: UserStatus;
    createdAt: Date;
    role: { code: string };
  }): StaffUserDto {
    const access = modulesForRole(user.role.code);
    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      name: `${user.firstName} ${user.lastName}`.trim(),
      email: user.email,
      role: user.role.code,
      roleLabel: roleDisplayLabel(user.role.code),
      status: user.status,
      isActive: user.status === UserStatus.ACTIVE,
      createdAt: user.createdAt.toISOString(),
      access,
      accessLabels: access.map((m) => m.label),
    };
  }
}

/** Exported for tests — assignable role codes. */
export const STAFF_ASSIGNABLE_ROLE_CODES = [...ASSIGNABLE_ROLES];
