import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ROLE_CODES } from '../auth/auth.constants';

/**
 * Stage 08 documented endpoint contracts (roles + permissions).
 * Tests RolesGuard against the seed permission matrix — not a parallel ACL.
 */
const ROLE_PERMS: Record<string, string[]> = {
  ADMIN: [
    'users.read',
    'users.manage',
    'products.read',
    'products.manage',
    'inventory.read',
    'inventory.manage',
    'orders.read',
    'orders.manage',
    'content.manage',
    'payments.read',
    'account.read',
    'delivery.read',
    'delivery.manage',
    'audit.read',
  ],
  INVENTORY_MANAGER: [
    'products.read',
    'inventory.read',
    'inventory.manage',
    'orders.read',
    'account.read',
  ],
  SALES_STAFF: [
    'products.read',
    'orders.read',
    'orders.manage',
    'payments.read',
    'users.read',
    'account.read',
    'delivery.read',
    'delivery.manage',
  ],
  CONTENT_MANAGER: [
    'products.read',
    'products.manage',
    'content.manage',
    'account.read',
  ],
  CUSTOMER: ['account.read'],
};

const ENDPOINTS: Array<{
  name: string;
  roles: string[];
  permissions: string[];
  expect: Record<string, boolean>;
}> = [
  {
    name: 'Dashboard',
    roles: [
      ROLE_CODES.ADMIN,
      ROLE_CODES.SALES_STAFF,
      ROLE_CODES.INVENTORY_MANAGER,
      ROLE_CODES.CONTENT_MANAGER,
    ],
    permissions: [],
    expect: {
      ADMIN: true,
      SALES_STAFF: true,
      INVENTORY_MANAGER: true,
      CONTENT_MANAGER: true,
      CUSTOMER: false,
    },
  },
  {
    name: 'Orders',
    roles: [
      ROLE_CODES.ADMIN,
      ROLE_CODES.SALES_STAFF,
      ROLE_CODES.INVENTORY_MANAGER,
    ],
    permissions: ['orders.read'],
    expect: {
      ADMIN: true,
      SALES_STAFF: true,
      INVENTORY_MANAGER: true,
      CONTENT_MANAGER: false,
      CUSTOMER: false,
    },
  },
  {
    name: 'Offline payment',
    roles: [ROLE_CODES.ADMIN, ROLE_CODES.SALES_STAFF],
    permissions: ['orders.manage'],
    expect: {
      ADMIN: true,
      SALES_STAFF: true,
      INVENTORY_MANAGER: false,
      CONTENT_MANAGER: false,
      CUSTOMER: false,
    },
  },
  {
    name: 'Delivery operation',
    roles: [ROLE_CODES.ADMIN, ROLE_CODES.SALES_STAFF],
    permissions: [],
    expect: {
      ADMIN: true,
      SALES_STAFF: true,
      INVENTORY_MANAGER: false,
      CONTENT_MANAGER: false,
      CUSTOMER: false,
    },
  },
  {
    name: 'Product create',
    roles: [ROLE_CODES.ADMIN, ROLE_CODES.CONTENT_MANAGER],
    permissions: ['products.manage'],
    expect: {
      ADMIN: true,
      SALES_STAFF: false,
      INVENTORY_MANAGER: false,
      CONTENT_MANAGER: true,
      CUSTOMER: false,
    },
  },
  {
    name: 'Storefront image upload',
    roles: [ROLE_CODES.ADMIN, ROLE_CODES.CONTENT_MANAGER],
    permissions: ['content.manage'],
    expect: {
      ADMIN: true,
      SALES_STAFF: false,
      INVENTORY_MANAGER: false,
      CONTENT_MANAGER: true,
      CUSTOMER: false,
    },
  },
  {
    name: 'Product price',
    roles: [ROLE_CODES.ADMIN],
    permissions: ['products.manage'],
    expect: {
      ADMIN: true,
      SALES_STAFF: false,
      INVENTORY_MANAGER: false,
      CONTENT_MANAGER: false,
      CUSTOMER: false,
    },
  },
  {
    name: 'Inventory / weight',
    roles: [ROLE_CODES.ADMIN, ROLE_CODES.INVENTORY_MANAGER],
    permissions: ['inventory.manage'],
    expect: {
      ADMIN: true,
      SALES_STAFF: false,
      INVENTORY_MANAGER: true,
      CONTENT_MANAGER: false,
      CUSTOMER: false,
    },
  },
  {
    name: 'Category management',
    roles: [ROLE_CODES.ADMIN, ROLE_CODES.CONTENT_MANAGER],
    permissions: ['content.manage'],
    expect: {
      ADMIN: true,
      SALES_STAFF: false,
      INVENTORY_MANAGER: false,
      CONTENT_MANAGER: true,
      CUSTOMER: false,
    },
  },
  {
    name: 'Subcategory management',
    roles: [ROLE_CODES.ADMIN, ROLE_CODES.CONTENT_MANAGER],
    permissions: ['content.manage'],
    expect: {
      ADMIN: true,
      SALES_STAFF: false,
      INVENTORY_MANAGER: false,
      CONTENT_MANAGER: true,
      CUSTOMER: false,
    },
  },
  {
    name: 'Audit',
    roles: [ROLE_CODES.ADMIN],
    permissions: ['audit.read'],
    expect: {
      ADMIN: true,
      SALES_STAFF: false,
      INVENTORY_MANAGER: false,
      CONTENT_MANAGER: false,
      CUSTOMER: false,
    },
  },
  {
    name: 'Image upload',
    roles: [ROLE_CODES.ADMIN, ROLE_CODES.CONTENT_MANAGER],
    permissions: ['products.manage'],
    expect: {
      ADMIN: true,
      SALES_STAFF: false,
      INVENTORY_MANAGER: false,
      CONTENT_MANAGER: true,
      CUSTOMER: false,
    },
  },
  {
    name: 'Staff management',
    roles: [ROLE_CODES.ADMIN],
    permissions: ['users.manage'],
    expect: {
      ADMIN: true,
      SALES_STAFF: false,
      INVENTORY_MANAGER: false,
      CONTENT_MANAGER: false,
      CUSTOMER: false,
    },
  },
];

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

function buildGuard(role: string | null, requiredRoles: string[], requiredPermissions: string[]) {
  const reflector = {
    getAllAndOverride: jest.fn((key: string) => {
      if (key === 'roles') return requiredRoles;
      if (key === 'permissions') return requiredPermissions;
      return undefined;
    }),
  };
  const prisma = {
    user: {
      findUnique: jest.fn().mockResolvedValue(role ? mockUser(role) : null),
    },
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
        authUser: role ? { userId: `user-${role}`, role } : undefined,
      }),
    }),
  };
  return { guard, ctx };
}

describe('Stage 08 RBAC matrix (RolesGuard + seed permissions)', () => {
  for (const endpoint of ENDPOINTS) {
    describe(endpoint.name, () => {
      for (const role of Object.keys(endpoint.expect)) {
        const allowed = endpoint.expect[role];
        it(`${role} → ${allowed ? 'ALLOW' : 'DENY'}`, async () => {
          const { guard, ctx } = buildGuard(
            role,
            endpoint.roles,
            endpoint.permissions,
          );
          if (allowed) {
            await expect(guard.canActivate(ctx as never)).resolves.toBe(true);
          } else {
            await expect(guard.canActivate(ctx as never)).rejects.toBeInstanceOf(
              ForbiddenException,
            );
          }
        });
      }
    });
  }

  it('rejects unauthenticated requests', async () => {
    const { guard, ctx } = buildGuard(null, [ROLE_CODES.ADMIN], []);
    // override request without authUser
    (ctx as { switchToHttp: () => { getRequest: () => object } }).switchToHttp =
      () => ({
        getRequest: () => ({}),
      });
    await expect(guard.canActivate(ctx as never)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });
});
