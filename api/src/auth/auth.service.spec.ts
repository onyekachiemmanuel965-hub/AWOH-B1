import {
  BadRequestException,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { UserStatus } from '@prisma/client';
import { AuthService } from './auth.service';
import { AuthRateLimiter } from './auth-rate-limiter';
import { hashPassword, hashRefreshToken } from './password.util';
import { ROLE_CODES } from './auth.constants';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: {
    role: { findUnique: jest.Mock };
    user: {
      findUnique: jest.Mock;
      create: jest.Mock;
    };
    refreshToken: {
      create: jest.Mock;
      findUnique: jest.Mock;
      update: jest.Mock;
      updateMany: jest.Mock;
    };
  };
  let jwt: { signAsync: jest.Mock };

  const customerRole = {
    id: 'role-customer',
    code: ROLE_CODES.CUSTOMER,
    name: 'Customer',
  };

  const adminRole = {
    id: 'role-admin',
    code: ROLE_CODES.ADMIN,
    name: 'Admin',
  };

  beforeEach(() => {
    prisma = {
      role: { findUnique: jest.fn() },
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
      },
      refreshToken: {
        create: jest.fn().mockResolvedValue({}),
        findUnique: jest.fn(),
        update: jest.fn().mockResolvedValue({}),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
    };
    jwt = {
      signAsync: jest.fn().mockResolvedValue('access.jwt.token'),
    };
    const config = {
      get: (key: string) => {
        if (key === 'JWT_ACCESS_TTL_SEC') return 900;
        if (key === 'JWT_REFRESH_TTL_SEC') return 86400;
        return undefined;
      },
    };

    // Manual construction avoids Jest ESM issues with @nestjs/jwt|config packages.
    service = new AuthService(
      prisma as never,
      jwt as never,
      config as never,
      new AuthRateLimiter(),
    );
  });

  it('registers a CUSTOMER and never stores plaintext passwords', async () => {
    prisma.role.findUnique.mockResolvedValue(customerRole);
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.user.create.mockImplementation(
      async ({ data }: { data: Record<string, unknown> }) => ({
        id: 'u1',
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        status: UserStatus.ACTIVE,
        passwordHash: data.passwordHash,
        roleId: customerRole.id,
        role: customerRole,
      }),
    );

    const result = await service.register(
      {
        email: '  New.User@Example.COM ',
        password: 'SecurePass1',
        firstName: 'Ada',
        lastName: 'Lovelace',
      },
      {},
      'test-ip',
    );

    expect(result.user.role).toBe('CUSTOMER');
    expect(result.user.email).toBe('new.user@example.com');
    expect(result.user).not.toHaveProperty('passwordHash');
    expect(JSON.stringify(result)).not.toContain('passwordHash');
    expect(prisma.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          roleId: customerRole.id,
          email: 'new.user@example.com',
        }),
      }),
    );
    const createdHash = prisma.user.create.mock.calls[0][0].data.passwordHash as string;
    expect(createdHash).not.toBe('SecurePass1');
    expect(createdHash.startsWith('$2')).toBe(true);
  });

  it('rejects weak passwords on register', async () => {
    prisma.role.findUnique.mockResolvedValue(customerRole);
    await expect(
      service.register(
        {
          email: 'a@example.com',
          password: 'password',
          firstName: 'A',
          lastName: 'B',
        },
        {},
        'weak-ip',
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects duplicate email with generic error', async () => {
    prisma.role.findUnique.mockResolvedValue(customerRole);
    prisma.user.findUnique.mockResolvedValue({ id: 'existing' });
    await expect(
      service.register(
        {
          email: 'a@example.com',
          password: 'SecurePass1',
          firstName: 'A',
          lastName: 'B',
        },
        {},
        'dup-ip',
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('logs in with correct credentials', async () => {
    const passwordHash = await hashPassword('SecurePass1');
    prisma.user.findUnique.mockResolvedValue({
      id: 'u1',
      email: 'a@example.com',
      firstName: 'A',
      lastName: 'B',
      status: UserStatus.ACTIVE,
      passwordHash,
      role: customerRole,
    });

    const result = await service.login(
      { email: 'a@example.com', password: 'SecurePass1' },
      {},
      'login-ok',
    );
    expect(result.user.id).toBe('u1');
    expect(result.tokens.accessToken).toBeTruthy();
    expect(result.tokens.refreshToken).toBeTruthy();
  });

  it('rejects incorrect password safely', async () => {
    const passwordHash = await hashPassword('SecurePass1');
    prisma.user.findUnique.mockResolvedValue({
      id: 'u1',
      email: 'a@example.com',
      firstName: 'A',
      lastName: 'B',
      status: UserStatus.ACTIVE,
      passwordHash,
      role: customerRole,
    });

    await expect(
      service.login(
        { email: 'a@example.com', password: 'WrongPass1' },
        {},
        'login-bad',
      ),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rejects unknown account safely', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    await expect(
      service.login(
        { email: 'missing@example.com', password: 'SecurePass1' },
        {},
        'login-missing',
      ),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rejects disabled accounts', async () => {
    const passwordHash = await hashPassword('SecurePass1');
    prisma.user.findUnique.mockResolvedValue({
      id: 'u1',
      email: 'a@example.com',
      firstName: 'A',
      lastName: 'B',
      status: UserStatus.DISABLED,
      passwordHash,
      role: customerRole,
    });

    await expect(
      service.login(
        { email: 'a@example.com', password: 'SecurePass1' },
        {},
        'login-disabled',
      ),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('returns me for active users and strips secrets', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'u1',
      email: 'a@example.com',
      firstName: 'A',
      lastName: 'B',
      status: UserStatus.ACTIVE,
      passwordHash: 'secret',
      role: customerRole,
    });
    const me = await service.me('u1');
    expect(me.email).toBe('a@example.com');
    expect(me).not.toHaveProperty('passwordHash');
  });

  it('rejects unauthenticated me for missing user', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    await expect(service.me('missing')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('refreshes a valid session and rotates token', async () => {
    const raw = 'refresh-raw-token';
    prisma.refreshToken.findUnique.mockResolvedValue({
      id: 'rt1',
      tokenHash: hashRefreshToken(raw),
      revokedAt: null,
      expiresAt: new Date(Date.now() + 60_000),
      user: {
        id: 'u1',
        email: 'a@example.com',
        firstName: 'A',
        lastName: 'B',
        status: UserStatus.ACTIVE,
        role: customerRole,
      },
    });

    const result = await service.refresh(raw, {}, 'refresh-ok');
    expect(result.user.id).toBe('u1');
    expect(prisma.refreshToken.update).toHaveBeenCalled();
    expect(prisma.refreshToken.create).toHaveBeenCalled();
  });

  it('rejects revoked refresh tokens', async () => {
    prisma.refreshToken.findUnique.mockResolvedValue({
      id: 'rt1',
      revokedAt: new Date(),
      expiresAt: new Date(Date.now() + 60_000),
      user: {
        id: 'u1',
        status: UserStatus.ACTIVE,
        role: customerRole,
      },
    });
    await expect(
      service.refresh('bad', {}, 'refresh-bad'),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('logout revokes refresh token', async () => {
    await service.logout('some-token');
    expect(prisma.refreshToken.updateMany).toHaveBeenCalled();
  });

  it('blocks CUSTOMER from staff role assertion', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'u1',
      status: UserStatus.ACTIVE,
      email: 'c@example.com',
      firstName: 'C',
      lastName: 'U',
      role: customerRole,
    });
    await expect(service.assertStaffRole('u1')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('allows ADMIN through staff role assertion', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'a1',
      status: UserStatus.ACTIVE,
      email: 'admin@example.com',
      firstName: 'A',
      lastName: 'D',
      role: adminRole,
    });
    const user = await service.assertStaffRole('a1');
    expect(user.role).toBe('ADMIN');
  });
});
