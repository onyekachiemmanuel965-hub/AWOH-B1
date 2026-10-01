import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { createReadStream, existsSync } from 'fs';
import { OrdersService } from './orders.service';
import { CreateOrderDto, UpdateDeliveryAddressDto } from './dto/create-order.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OriginGuard } from '../auth/guards/origin.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUserPayload } from '../auth/guards/jwt-auth.guard';
import { PaymentsService } from '../payments/payments.service';

@Controller('api/v1/orders')
@UseGuards(OriginGuard, JwtAuthGuard)
export class OrdersController {
  constructor(
    private readonly orders: OrdersService,
    private readonly payments: PaymentsService,
  ) {}

  @Post()
  create(
    @CurrentUser() user: AuthUserPayload,
    @Body() dto: CreateOrderDto,
  ) {
    return this.orders.createOrder(user.userId, dto);
  }

  @Get()
  list(@CurrentUser() user: AuthUserPayload) {
    return this.orders.listForUser(user.userId);
  }

  @Get(':orderId')
  get(
    @CurrentUser() user: AuthUserPayload,
    @Param('orderId') orderId: string,
  ) {
    return this.orders.getForUser(user.userId, orderId);
  }

  /** Customer accepts the current staff-entered delivery quote (version-aware). */
  @Post(':orderId/delivery/accept-quote')
  acceptDeliveryQuote(
    @CurrentUser() user: AuthUserPayload,
    @Param('orderId') orderId: string,
    @Req() req: Request,
  ) {
    return this.orders.acceptDeliveryQuote(user.userId, orderId, req.ip);
  }

  /** Customer updates delivery address (invalidates prior quote). */
  @Post(':orderId/delivery/address')
  updateDeliveryAddress(
    @CurrentUser() user: AuthUserPayload,
    @Param('orderId') orderId: string,
    @Body() dto: UpdateDeliveryAddressDto,
    @Req() req: Request,
  ) {
    return this.orders.updateDeliveryAddress(user.userId, orderId, dto, req.ip);
  }

  @Post(':orderId/payment/initialize')
  initializePayment(
    @CurrentUser() user: AuthUserPayload,
    @Param('orderId') orderId: string,
  ) {
    return this.payments.initializePaystack(user.userId, orderId);
  }

  @Post(':orderId/payment/verify')
  verifyPayment(
    @CurrentUser() user: AuthUserPayload,
    @Param('orderId') orderId: string,
    @Body() body: { reference?: string },
  ) {
    return this.payments.verifyOrderPayment(
      user.userId,
      orderId,
      body?.reference,
    );
  }

  @Get(':orderId/receipt')
  async downloadReceipt(
    @CurrentUser() user: AuthUserPayload,
    @Param('orderId') orderId: string,
    @Res() res: Response,
  ) {
    const { receipt, orderNumber } =
      await this.payments.getReceiptDownloadForUser(user.userId, orderId);
    const path = receipt.storagePath;
    if (!existsSync(path)) {
      res.status(404).json({ message: 'Receipt file not found.' });
      return;
    }
    const safeName = `AWOH-B-Receipt-${orderNumber}.pdf`.replace(
      /[^\w.\-]+/g,
      '_',
    );
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${safeName}"`);
    res.setHeader('Cache-Control', 'private, no-store');
    createReadStream(path).pipe(res);
  }
}
