import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AdminAuditService } from './admin-audit.service';
import { AuditQueryDto } from './dto/admin.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OriginGuard } from '../auth/guards/origin.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { ROLE_CODES } from '../auth/auth.constants';

@Controller('api/v1/admin/audit')
@UseGuards(OriginGuard, JwtAuthGuard, RolesGuard)
export class AdminAuditController {
  constructor(private readonly audit: AdminAuditService) {}

  @Get()
  @Roles(ROLE_CODES.ADMIN)
  @RequirePermissions('audit.read')
  list(@Query() query: AuditQueryDto) {
    return this.audit.list(query);
  }
}
