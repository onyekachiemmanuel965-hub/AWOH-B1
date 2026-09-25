import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DeliveryService } from './delivery.service';
import { DeliveryController } from './delivery.controller';
import { MockDistanceProvider } from './mock-distance.provider';
import { DISTANCE_PROVIDER } from './distance-provider';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, ConfigModule, AuditModule, AuthModule],
  controllers: [DeliveryController],
  providers: [
    DeliveryService,
    MockDistanceProvider,
    { provide: DISTANCE_PROVIDER, useExisting: MockDistanceProvider },
  ],
  exports: [DeliveryService],
})
export class DeliveryModule {}
