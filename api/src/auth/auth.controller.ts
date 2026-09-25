import {
  Controller,
  Get,
  Post,
  Body,
  Req,
  Res,
  UseGuards,
  HttpCode,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto, RegisterDto } from './dto/auth.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { OriginGuard } from './guards/origin.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { Roles } from './decorators/roles.decorator';
import { RequirePermissions } from './decorators/permissions.decorator';
import { ROLE_CODES, REFRESH_COOKIE } from './auth.constants';
import { clearAuthCookies, setAuthCookies } from './auth-cookies';
import type { AuthUserPayload } from './guards/jwt-auth.guard';

@Controller('api/v1/auth')
@UseGuards(OriginGuard)
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly config: ConfigService,
  ) {}

  @Post('register')
  async register(
    @Body() dto: RegisterDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.auth.register(
      dto,
      { ip: req.ip, userAgent: req.headers['user-agent'] },
      this.clientKey(req),
    );
    setAuthCookies(res, result.tokens, this.config);
    return { user: result.user };
  }

  @Post('login')
  @HttpCode(200)
  async login(
    @Body() dto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.auth.login(
      dto,
      { ip: req.ip, userAgent: req.headers['user-agent'] },
      this.clientKey(req),
    );
    setAuthCookies(res, result.tokens, this.config);
    return { user: result.user };
  }

  @Post('refresh')
  @HttpCode(200)
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const raw = req.cookies?.[REFRESH_COOKIE] as string | undefined;
    const result = await this.auth.refresh(
      raw,
      { ip: req.ip, userAgent: req.headers['user-agent'] },
      this.clientKey(req),
    );
    setAuthCookies(res, result.tokens, this.config);
    return { user: result.user };
  }

  @Post('logout')
  @HttpCode(200)
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const raw = req.cookies?.[REFRESH_COOKIE] as string | undefined;
    await this.auth.logout(raw);
    clearAuthCookies(res, this.config);
    return { ok: true };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async me(@CurrentUser() authUser: AuthUserPayload) {
    const user = await this.auth.me(authUser.userId);
    return { user };
  }

  /**
   * Authorization probe: any authenticated customer (or staff) with account.read.
   * Used to prove guards work; not a customer dashboard.
   */
  @Get('rbac/customer-check')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RequirePermissions('account.read')
  customerCheck(@CurrentUser() authUser: AuthUserPayload) {
    return {
      ok: true,
      scope: 'customer',
      userId: authUser.userId,
      role: authUser.role,
    };
  }

  /**
   * Authorization probe: staff-only. CUSTOMER must receive 403.
   */
  @Get('rbac/staff-check')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(
    ROLE_CODES.ADMIN,
    ROLE_CODES.INVENTORY_MANAGER,
    ROLE_CODES.SALES_STAFF,
    ROLE_CODES.CONTENT_MANAGER,
  )
  staffCheck(@CurrentUser() authUser: AuthUserPayload) {
    return {
      ok: true,
      scope: 'staff',
      userId: authUser.userId,
      role: authUser.role,
    };
  }

  private clientKey(req: Request) {
    return req.ip || req.socket.remoteAddress || 'unknown';
  }
}
