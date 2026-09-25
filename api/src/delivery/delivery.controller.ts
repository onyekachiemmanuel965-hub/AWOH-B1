import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { DeliveryService } from './delivery.service';
import {
  ConfirmDeliveryDto,
  DeliveryQuoteDto,
  OverrideDeliveryDto,
} from './dto/delivery.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OriginGuard } from '../auth/guards/origin.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUserPayload } from '../auth/guards/jwt-auth.guard';
import { ROLE_CODES } from '../auth/auth.constants';
import { InMemoryRateLimiter } from '../common/in-memory-rate-limiter';

@Controller('api/v1')
export class DeliveryController {
  constructor(
    private readonly delivery: DeliveryService,
    private readonly rateLimiter: InMemoryRateLimiter,
  ) {}

  /** Pre-checkout customer quote — safe DTO only. */
  @Post('delivery/quote')
  @UseGuards(OriginGuard, JwtAuthGuard)
  quote(
    @CurrentUser() user: AuthUserPayload,
    @Body() dto: DeliveryQuoteDto,
    @Req() req: Request,
  ) {
    const key = `delivery-quote:${user.userId}:${req.ip ?? 'unknown'}`;
    if (!this.rateLimiter.attempt(key, 40, 15 * 60 * 1000)) {
      throw new HttpException(
        'Too many delivery quote requests. Please try again later.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    return this.delivery.quotePreview(dto);
  }

  /** Customer-safe delivery status for own order. */
  @Get('orders/:orderId/delivery')
  @UseGuards(OriginGuard, JwtAuthGuard)
  getForOrder(
    @CurrentUser() user: AuthUserPayload,
    @Param('orderId') orderId: string,
  ) {
    return this.delivery.getCustomerDelivery(user.userId, orderId);
  }

  /** Staff internal delivery view. */
  @Get('orders/:orderId/delivery/internal')
  @UseGuards(OriginGuard, JwtAuthGuard, RolesGuard)
  @Roles(ROLE_CODES.ADMIN, ROLE_CODES.SALES_STAFF)
  getInternal(@Param('orderId') orderId: string) {
    return this.delivery.getStaffDelivery(orderId);
  }

  @Post('orders/:orderId/delivery/confirm')
  @UseGuards(OriginGuard, JwtAuthGuard, RolesGuard)
  @Roles(ROLE_CODES.ADMIN, ROLE_CODES.SALES_STAFF)
  confirm(
    @CurrentUser() user: AuthUserPayload,
    @Param('orderId') orderId: string,
    @Body() dto: ConfirmDeliveryDto,
    @Req() req: Request,
  ) {
    return this.delivery.confirmQuote(
      user.userId,
      orderId,
      dto,
      req.ip,
    );
  }

  @Post('orders/:orderId/delivery/override')
  @UseGuards(OriginGuard, JwtAuthGuard, RolesGuard)
  @Roles(ROLE_CODES.ADMIN, ROLE_CODES.SALES_STAFF)
  override(
    @CurrentUser() user: AuthUserPayload,
    @Param('orderId') orderId: string,
    @Body() dto: OverrideDeliveryDto,
    @Req() req: Request,
  ) {
    return this.delivery.overrideFee(user.userId, orderId, dto, req.ip);
  }
}
