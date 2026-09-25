import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { AdminOrdersService } from './admin-orders.service';
import { PaymentsService } from '../payments/payments.service';
import {
  AdminOrdersQueryDto,
  ConfirmOfflineDto,
} from './dto/admin.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OriginGuard } from '../auth/guards/origin.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUserPayload } from '../auth/guards/jwt-auth.guard';
import { ROLE_CODES } from '../auth/auth.constants';

@Controller('api/v1/admin')
@UseGuards(OriginGuard, JwtAuthGuard, RolesGuard)
export class AdminOrdersController {
  constructor(
    private readonly orders: AdminOrdersService,
    private readonly payments: PaymentsService,
  ) {}

  @Get('dashboard')
  @Roles(
    ROLE_CODES.ADMIN,
    ROLE_CODES.SALES_STAFF,
    ROLE_CODES.INVENTORY_MANAGER,
    ROLE_CODES.CONTENT_MANAGER,
  )
  dashboard() {
    return this.orders.dashboardStats();
  }

  @Get('orders')
  @Roles(ROLE_CODES.ADMIN, ROLE_CODES.SALES_STAFF, ROLE_CODES.INVENTORY_MANAGER)
  @RequirePermissions('orders.read')
  list(@Query() query: AdminOrdersQueryDto) {
    return this.orders.list(query);
  }

  @Get('orders/:orderId')
  @Roles(ROLE_CODES.ADMIN, ROLE_CODES.SALES_STAFF, ROLE_CODES.INVENTORY_MANAGER)
  @RequirePermissions('orders.read')
  get(@Param('orderId') orderId: string) {
    return this.orders.getById(orderId);
  }

  @Post('orders/:orderId/payments/confirm-offline')
  @Roles(ROLE_CODES.ADMIN, ROLE_CODES.SALES_STAFF)
  @RequirePermissions('orders.manage')
  confirmOffline(
    @CurrentUser() user: AuthUserPayload,
    @Param('orderId') orderId: string,
    @Body() dto: ConfirmOfflineDto,
    @Req() req: Request,
  ) {
    return this.payments.confirmOfflinePayment(
      user.userId,
      orderId,
      dto.reason,
      req.ip,
    );
  }
}
