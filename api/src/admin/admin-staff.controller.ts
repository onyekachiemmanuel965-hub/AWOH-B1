import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { AdminStaffService } from './admin-staff.service';
import {
  StaffListQueryDto,
  UpdateStaffRoleDto,
  UpdateStaffStatusDto,
} from './dto/admin.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OriginGuard } from '../auth/guards/origin.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUserPayload } from '../auth/guards/jwt-auth.guard';
import { ROLE_CODES } from '../auth/auth.constants';

@Controller('api/v1/admin/staff')
@UseGuards(OriginGuard, JwtAuthGuard, RolesGuard)
export class AdminStaffController {
  constructor(private readonly staff: AdminStaffService) {}

  @Get()
  @Roles(ROLE_CODES.ADMIN)
  @RequirePermissions('users.manage')
  list(@Query() query: StaffListQueryDto) {
    return this.staff.list(query);
  }

  @Patch(':id/role')
  @Roles(ROLE_CODES.ADMIN)
  @RequirePermissions('users.manage')
  updateRole(
    @CurrentUser() user: AuthUserPayload,
    @Param('id') id: string,
    @Body() dto: UpdateStaffRoleDto,
    @Req() req: Request,
  ) {
    return this.staff.updateRole(user.userId, id, dto, req.ip);
  }

  @Patch(':id/status')
  @Roles(ROLE_CODES.ADMIN)
  @RequirePermissions('users.manage')
  updateStatus(
    @CurrentUser() user: AuthUserPayload,
    @Param('id') id: string,
    @Body() dto: UpdateStaffStatusDto,
    @Req() req: Request,
  ) {
    return this.staff.updateStatus(user.userId, id, dto, req.ip);
  }
}
