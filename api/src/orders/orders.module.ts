import { Module, forwardRef } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { PaymentsModule } from '../payments/payments.module';
import { DeliveryModule } from '../delivery/delivery.module';
import { AuditModule } from '../audit/audit.module';
import { LocationsModule } from '../locations/locations.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    AuditModule,
    LocationsModule,
    forwardRef(() => DeliveryModule),
    forwardRef(() => PaymentsModule),
  ],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
