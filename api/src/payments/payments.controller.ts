import {
  Controller,
  Headers,
  Post,
  Req,
  HttpCode,
} from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import type { Request } from 'express';
import { PaymentsService } from './payments.service';

@Controller('api/v1/payments')
export class PaymentsController {
  constructor(private readonly payments: PaymentsService) {}

  /**
   * Paystack webhook — signature verified; no browser CSRF (server-to-server).
   */
  @Post('webhooks/paystack')
  @HttpCode(200)
  async paystackWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('x-paystack-signature') signature?: string,
  ) {
    const raw =
      req.rawBody ||
      Buffer.from(JSON.stringify(req.body ?? {}), 'utf8');
    return this.payments.handlePaystackWebhook(raw, signature);
  }
}
