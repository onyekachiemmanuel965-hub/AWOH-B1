import {
  Controller,
  Get,
  UseGuards,
} from '@nestjs/common';
import { AdminStaffService } from './admin-staff.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OriginGuard } from '../auth/guards/origin.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUserPayload } from '../auth/guards/jwt-auth.guard';
import { ROLE_CODES } from '../auth/auth.constants';

/**
 * Current staff member's role + user-facing access modules.
 * CUSTOMER is denied (403) — no admin workspace access.
 */
@Controller('api/v1/admin/me')
@UseGuards(OriginGuard, JwtAuthGuard, RolesGuard)
export class AdminAccessController {
  constructor(private readonly staff: AdminStaffService) {}

  @Get('access')
  @Roles(
    ROLE_CODES.ADMIN,
    ROLE_CODES.SALES_STAFF,
    ROLE_CODES.INVENTORY_MANAGER,
    ROLE_CODES.CONTENT_MANAGER,
  )
  myAccess(@CurrentUser() user: AuthUserPayload) {
    return this.staff.getMyAccess(user.userId);
  }
}
