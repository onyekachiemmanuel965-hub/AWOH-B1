import {
  BadRequestException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UserStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto, RegisterDto } from './dto/auth.dto';
import { ROLE_CODES } from './auth.constants';
import { toPublicUser, PublicUser } from './auth.mapper';
import {
  generateRefreshToken,
  hashPassword,
  hashRefreshToken,
  isPasswordAcceptable,
  verifyPassword,
} from './password.util';
import { InMemoryRateLimiter } from '../common/in-memory-rate-limiter';

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
  accessMaxAgeSec: number;
  refreshMaxAgeSec: number;
};

export type AuthResult = {
  user: PublicUser;
  tokens: AuthTokens;
};

type JwtPayload = {
  sub: string;
  role: string;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly rateLimiter: InMemoryRateLimiter,
  ) {}

  private accessTtlSec() {
    return Number(this.config.get('JWT_ACCESS_TTL_SEC') ?? 900);
  }

  private refreshTtlSec() {
    return Number(this.config.get('JWT_REFRESH_TTL_SEC') ?? 60 * 60 * 24 * 14);
  }

  private assertRateLimit(key: string, limit: number, windowMs: number) {
    if (!this.rateLimiter.attempt(key, limit, windowMs)) {
      throw new HttpException(
        'Too many attempts. Please try again later.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }

  async register(
    dto: RegisterDto,
    meta: { ip?: string; userAgent?: string },
    rateKey: string,
  ): Promise<AuthResult> {
    this.assertRateLimit(`register:${rateKey}`, 8, 15 * 60 * 1000);

    const email = dto.email.trim().toLowerCase();
    const firstName = dto.firstName.trim();
    const lastName = dto.lastName.trim();

    if (!isPasswordAcceptable(dto.password)) {
      throw new BadRequestException('Password does not meet security requirements.');
    }

    const customerRole = await this.prisma.role.findUnique({
      where: { code: ROLE_CODES.CUSTOMER },
    });
    if (!customerRole) {
      throw new BadRequestException('Registration is temporarily unavailable.');
    }

    const existing = await this.prisma.user.findUnique({
      where: { email },
    });
    if (existing) {
      // Generic message — avoid account enumeration
      throw new BadRequestException('Unable to complete registration.');
    }

    const passwordHash = await hashPassword(dto.password);

    const user = await this.prisma.user.create({
      data: {
        email,
        passwordHash,
        firstName,
        lastName,
        roleId: customerRole.id,
        status: UserStatus.ACTIVE,
      },
      include: { role: true },
    });

    const tokens = await this.issueSession(user.id, user.role.code, meta);
    return { user: toPublicUser(user), tokens };
  }

  async login(
    dto: LoginDto,
    meta: { ip?: string; userAgent?: string },
    rateKey: string,
  ): Promise<AuthResult> {
    this.assertRateLimit(`login:${rateKey}`, 12, 15 * 60 * 1000);
    const email = dto.email.trim().toLowerCase();

    const user = await this.prisma.user.findUnique({
      where: { email },
      include: { role: true },
    });

    // Constant-ish failure path
    const invalid = () => {
      throw new UnauthorizedException('Invalid email or password.');
    };

    if (!user) {
      // Burn a compare cycle against a valid dummy hash (not a real account).
      await verifyPassword(
        dto.password,
        '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW',
      );
      invalid();
    }

    const ok = await verifyPassword(dto.password, user!.passwordHash);
    if (!ok) invalid();

    if (user!.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    const tokens = await this.issueSession(user!.id, user!.role.code, meta);
    return { user: toPublicUser(user!), tokens };
  }

  async me(userId: string): Promise<PublicUser> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });
    if (!user || user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('Authentication required.');
    }
    return toPublicUser(user);
  }

  async refresh(
    rawRefreshToken: string | undefined,
    meta: { ip?: string; userAgent?: string },
    rateKey: string,
  ): Promise<AuthResult> {
    this.assertRateLimit(`refresh:${rateKey}`, 30, 15 * 60 * 1000);

    if (!rawRefreshToken) {
      throw new UnauthorizedException('Authentication required.');
    }

    const tokenHash = hashRefreshToken(rawRefreshToken);
    const stored = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: { include: { role: true } } },
    });

    if (!stored || stored.revokedAt || stored.expiresAt.getTime() <= Date.now()) {
      throw new UnauthorizedException('Authentication required.');
    }

    if (stored.user.status !== UserStatus.ACTIVE) {
      await this.prisma.refreshToken.update({
        where: { id: stored.id },
        data: { revokedAt: new Date() },
      });
      throw new UnauthorizedException('Authentication required.');
    }

    // Rotate: revoke old refresh token
    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    });

    const tokens = await this.issueSession(
      stored.user.id,
      stored.user.role.code,
      meta,
    );
    return { user: toPublicUser(stored.user), tokens };
  }

  async logout(rawRefreshToken: string | undefined): Promise<void> {
    if (!rawRefreshToken) return;
    const tokenHash = hashRefreshToken(rawRefreshToken);
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async assertPermission(userId: string, permissionCode: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        role: {
          include: {
            permissions: { include: { permission: true } },
          },
        },
      },
    });
    if (!user || user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('Authentication required.');
    }
    const codes = user.role.permissions.map((rp) => rp.permission.code);
    if (user.role.code === ROLE_CODES.ADMIN) {
      return { user: toPublicUser(user), permissions: codes };
    }
    if (!codes.includes(permissionCode)) {
      throw new ForbiddenException('Insufficient permissions.');
    }
    return { user: toPublicUser(user), permissions: codes };
  }

  async assertStaffRole(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });
    if (!user || user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('Authentication required.');
    }
    if (user.role.code === ROLE_CODES.CUSTOMER) {
      throw new ForbiddenException('Insufficient permissions.');
    }
    return toPublicUser(user);
  }

  private async issueSession(
    userId: string,
    roleCode: string,
    meta: { ip?: string; userAgent?: string },
  ): Promise<AuthTokens> {
    const accessMaxAgeSec = this.accessTtlSec();
    const refreshMaxAgeSec = this.refreshTtlSec();

    const accessToken = await this.jwt.signAsync(
      { sub: userId, role: roleCode } satisfies JwtPayload,
      { expiresIn: accessMaxAgeSec },
    );

    const refreshToken = generateRefreshToken();
    const tokenHash = hashRefreshToken(refreshToken);
    const expiresAt = new Date(Date.now() + refreshMaxAgeSec * 1000);

    await this.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash,
        expiresAt,
        userAgent: meta.userAgent?.slice(0, 300) ?? null,
        ip: meta.ip?.slice(0, 64) ?? null,
      },
    });

    return { accessToken, refreshToken, accessMaxAgeSec, refreshMaxAgeSec };
  }
}
