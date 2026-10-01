import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { UserStatus } from '@prisma/client';
import { AdminStaffService } from './admin-staff.service';
import { ROLE_CODES } from '../auth/auth.constants';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Reflector } from '@nestjs/core';

describe('AdminStaffService safety', () => {
  function buildService(overrides: {
    users?: unknown[];
    countAdmins?: number;
    findUnique?: jest.Mock;
    update?: jest.Mock;
    count?: jest.Mock;
  }) {
    const audit = { log: jest.fn() };
    const prisma = {
      user: {
        findMany: jest.fn().mockResolvedValue(overrides.users ?? []),
        count: jest.fn().mockResolvedValue(overrides.countAdmins ?? 1),
        findUnique:
          overrides.findUnique ??
          jest.fn().mockResolvedValue({
            id: 't1',
            email: 't@example.com',
            firstName: 'T',
            lastName: 'User',
            status: UserStatus.ACTIVE,
            createdAt: new Date(),
            role: { code: ROLE_CODES.CUSTOMER, id: 'r-c' },
            roleId: 'r-c',
          }),
        update:
          overrides.update ??
          jest.fn().mockImplementation(({ data }) =>
            Promise.resolve({
              id: 't1',
              email: 't@example.com',
              firstName: 'T',
              lastName: 'User',
              status: data.status ?? UserStatus.ACTIVE,
              createdAt: new Date(),
              role: {
                code: data.roleId === 'r-admin' ? ROLE_CODES.ADMIN : ROLE_CODES.SALES_STAFF,
                id: data.roleId ?? 'r-s',
              },
            }),
          ),
      },
      role: {
        findUnique: jest.fn().mockImplementation(({ where }: { where: { code: string } }) =>
          Promise.resolve({ id: `r-${where.code}`, code: where.code }),
        ),
      },
      refreshToken: {
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      $transaction: jest.fn(async (ops: unknown[]) => {
        if (Array.isArray(ops)) {
          return Promise.all(ops as Promise<unknown>[]);
        }
        return ops;
      }),
      ...(overrides.count ? {} : {}),
    };
    if (overrides.count) {
      prisma.user.count = overrides.count;
    }
    return {
      service: new AdminStaffService(prisma as never, audit as never),
      prisma,
      audit,
    };
  }

  it('maps list DTOs without passwordHash', async () => {
    const createdAt = new Date('2026-01-01T00:00:00.000Z');
    const { service } = buildService({
      users: [
        {
          id: 'u1',
          firstName: 'Ada',
          lastName: 'Admin',
          email: 'ada@example.com',
          status: UserStatus.ACTIVE,
          createdAt,
          role: { code: ROLE_CODES.ADMIN },
          passwordHash: 'secret',
        },
      ],
    });
    // Override list path properly
    const prisma = {
      user: {
        count: jest.fn().mockResolvedValue(1),
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'u1',
            firstName: 'Ada',
            lastName: 'Admin',
            email: 'ada@example.com',
            status: UserStatus.ACTIVE,
            createdAt,
            role: { code: ROLE_CODES.ADMIN },
            passwordHash: 'secret',
          },
        ]),
      },
      $transaction: jest.fn(async (ops: Promise<unknown>[]) => Promise.all(ops)),
    };
    const audit = { log: jest.fn() };
    const svc = new AdminStaffService(prisma as never, audit as never);
    const res = await svc.list({ page: 1, limit: 20 });
    expect(res.data[0].email).toBe('ada@example.com');
    expect(res.data[0].isActive).toBe(true);
    expect(JSON.stringify(res)).not.toContain('passwordHash');
    expect(JSON.stringify(res)).not.toContain('secret');
  });

  it('rejects self role change', async () => {
    const { service } = buildService({});
    await expect(
      service.updateRole('t1', 't1', { role: ROLE_CODES.SALES_STAFF }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rejects self status change', async () => {
    const { service } = buildService({});
    await expect(
      service.updateStatus('t1', 't1', { isActive: false }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rejects demoting the last active ADMIN', async () => {
    const findUnique = jest.fn().mockResolvedValue({
      id: 'admin1',
      email: 'a@example.com',
      firstName: 'A',
      lastName: 'A',
      status: UserStatus.ACTIVE,
      createdAt: new Date(),
      role: { code: ROLE_CODES.ADMIN, id: 'r-a' },
      roleId: 'r-a',
    });
    const count = jest.fn().mockResolvedValue(0);
    const { service } = buildService({ findUnique, count });
    await expect(
      service.updateRole('actor', 'admin1', { role: ROLE_CODES.CUSTOMER }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects deactivating the last active ADMIN', async () => {
    const findUnique = jest.fn().mockResolvedValue({
      id: 'admin1',
      email: 'a@example.com',
      firstName: 'A',
      lastName: 'A',
      status: UserStatus.ACTIVE,
      createdAt: new Date(),
      role: { code: ROLE_CODES.ADMIN, id: 'r-a' },
      roleId: 'r-a',
    });
    const count = jest.fn().mockResolvedValue(0);
    const { service } = buildService({ findUnique, count });
    await expect(
      service.updateStatus('actor', 'admin1', { isActive: false }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('returns 404 for missing user', async () => {
    const findUnique = jest.fn().mockResolvedValue(null);
    const { service } = buildService({ findUnique });
    await expect(
      service.updateRole('actor', 'missing', { role: ROLE_CODES.SALES_STAFF }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rejects invalid role', async () => {
    const { service } = buildService({});
    await expect(
      service.updateRole('actor', 't1', { role: 'SUPERUSER' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('audits role change and revokes refresh tokens', async () => {
    const { service, prisma, audit } = buildService({});
    await service.updateRole('actor', 't1', { role: ROLE_CODES.SALES_STAFF });
    expect(audit.log).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'staff.role_changed',
        actorUserId: 'actor',
        entityId: 't1',
        metadata: expect.objectContaining({
          previousRole: ROLE_CODES.CUSTOMER,
          newRole: ROLE_CODES.SALES_STAFF,
        }),
      }),
    );
    expect(prisma.refreshToken.updateMany).toHaveBeenCalled();
  });

  it('audits status change', async () => {
    const { service, audit } = buildService({});
    await service.updateStatus('actor', 't1', { isActive: false });
    expect(audit.log).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'staff.user_deactivated',
        metadata: expect.objectContaining({
          previousStatus: UserStatus.ACTIVE,
          newStatus: UserStatus.DISABLED,
        }),
      }),
    );
  });

  it('returns my access modules for staff', async () => {
    const findUnique = jest.fn().mockResolvedValue({
      id: 'inv1',
      firstName: 'Ivy',
      lastName: 'Stock',
      email: 'ivy@example.com',
      status: UserStatus.ACTIVE,
      role: {
        code: ROLE_CODES.INVENTORY_MANAGER,
        permissions: [
          { permission: { code: 'inventory.read' } },
          { permission: { code: 'inventory.manage' } },
        ],
      },
    });
    const { service } = buildService({ findUnique });
    const access = await service.getMyAccess('inv1');
    expect(access.roleLabel).toBe('Inventory Manager');
    expect(access.modules.map((m) => m.label)).toEqual([
      'Dashboard',
      'Products',
      'Inventory',
    ]);
    expect(access.modules.map((m) => m.label)).not.toContain('Staff');
    expect(access.modules.map((m) => m.label)).not.toContain('Delivery');
    expect(access.allowedLabels).toEqual(
      expect.arrayContaining(['Dashboard', 'Inventory']),
    );
    expect(access.restrictedLabels).toEqual(
      expect.arrayContaining(['Staff', 'Delivery', 'Payments', 'CMS']),
    );
    expect(access.permissions).toEqual(
      expect.arrayContaining(['inventory.read', 'inventory.manage']),
    );
  });

  it('denies CUSTOMER my-access', async () => {
    const findUnique = jest.fn().mockResolvedValue({
      id: 'c1',
      firstName: 'Cus',
      lastName: 'Tomer',
      email: 'c@example.com',
      status: UserStatus.ACTIVE,
      role: { code: ROLE_CODES.CUSTOMER },
    });
    const { service } = buildService({ findUnique });
    await expect(service.getMyAccess('c1')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });
});

describe('Staff endpoints RBAC (RolesGuard)', () => {
  const ROLE_PERMS: Record<string, string[]> = {
    ADMIN: ['users.manage', 'users.read'],
    SALES_STAFF: ['orders.read'],
    INVENTORY_MANAGER: ['inventory.manage'],
    CONTENT_MANAGER: ['content.manage'],
    CUSTOMER: ['account.read'],
  };

  function mockUser(role: string) {
    return {
      id: `user-${role}`,
      status: 'ACTIVE',
      role: {
        code: role,
        permissions: (ROLE_PERMS[role] ?? []).map((code) => ({
          permission: { code },
        })),
      },
    };
  }

  async function tryAccess(role: string) {
    const reflector = {
      getAllAndOverride: jest.fn((key: string) => {
        if (key === 'roles') return [ROLE_CODES.ADMIN];
        if (key === 'permissions') return ['users.manage'];
        return undefined;
      }),
    };
    const prisma = {
      user: { findUnique: jest.fn().mockResolvedValue(mockUser(role)) },
    };
    const guard = new RolesGuard(
      reflector as unknown as Reflector,
      prisma as never,
    );
    const ctx = {
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({
        getRequest: () => ({
          authUser: { userId: `user-${role}`, role },
        }),
      }),
    };
    return guard.canActivate(ctx as never);
  }

  it.each([
    ['ADMIN', true],
    ['SALES_STAFF', false],
    ['INVENTORY_MANAGER', false],
    ['CONTENT_MANAGER', false],
    ['CUSTOMER', false],
  ] as const)('%s staff management → %s', async (role, allowed) => {
    if (allowed) {
      await expect(tryAccess(role)).resolves.toBe(true);
    } else {
      await expect(tryAccess(role)).rejects.toBeInstanceOf(
        ForbiddenException,
      );
    }
  });
});
