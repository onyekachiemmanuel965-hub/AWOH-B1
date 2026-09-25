import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { PAYMENT_PROVIDER } from './payment-provider';
import { MockPaymentProvider } from './mock-payment.provider';
import { PaystackPaymentProvider } from './paystack-payment.provider';
import { PaystackWebhookVerifier } from './paystack-webhook.verifier';
import { ReceiptService } from './receipt.service';
import { PrismaModule } from '../prisma/prisma.module';
import { OrdersModule } from '../orders/orders.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [
    PrismaModule,
    ConfigModule,
    AuditModule,
    forwardRef(() => OrdersModule),
  ],
  controllers: [PaymentsController],
  providers: [
    PaymentsService,
    PaystackWebhookVerifier,
    ReceiptService,
    MockPaymentProvider,
    PaystackPaymentProvider,
    {
      provide: PAYMENT_PROVIDER,
      inject: [ConfigService, MockPaymentProvider, PaystackPaymentProvider],
      useFactory: (
        config: ConfigService,
        mock: MockPaymentProvider,
        paystack: PaystackPaymentProvider,
      ) => {
        const mode = (config.get<string>('PAYSTACK_MODE') || '').toLowerCase();
        const secret = config.get<string>('PAYSTACK_SECRET_KEY');
        if (mode === 'mock' || !secret) {
          return mock;
        }
        return paystack;
      },
    },
  ],
  exports: [PaymentsService, PAYMENT_PROVIDER, ReceiptService],
})
export class PaymentsModule {}
