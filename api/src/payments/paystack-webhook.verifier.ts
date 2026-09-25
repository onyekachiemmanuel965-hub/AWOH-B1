import { createHmac, timingSafeEqual } from 'crypto';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PaystackWebhookVerifier {
  constructor(private readonly config: ConfigService) {}

  verifySignature(rawBody: Buffer | string, signatureHeader?: string) {
    const secret =
      this.config.get<string>('PAYSTACK_WEBHOOK_SECRET') ||
      this.config.get<string>('PAYSTACK_SECRET_KEY');
    if (!secret) {
      throw new UnauthorizedException('Webhook verification unavailable.');
    }
    if (!signatureHeader) {
      throw new UnauthorizedException('Missing webhook signature.');
    }
    const body =
      typeof rawBody === 'string' ? Buffer.from(rawBody, 'utf8') : rawBody;
    const hash = createHmac('sha512', secret).update(body).digest('hex');
    const expected = Buffer.from(hash, 'utf8');
    const received = Buffer.from(signatureHeader, 'utf8');
    if (
      expected.length !== received.length ||
      !timingSafeEqual(expected, received)
    ) {
      throw new UnauthorizedException('Invalid webhook signature.');
    }
  }
}
