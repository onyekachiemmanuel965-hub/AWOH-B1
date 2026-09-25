import { Module } from '@nestjs/common';
import { AdminOrdersService } from './admin-orders.service';
import { AdminOrdersController } from './admin-orders.controller';
import { AdminCatalogService } from './admin-catalog.service';
import { AdminCatalogController } from './admin-catalog.controller';
import { AdminAuditService } from './admin-audit.service';
import { AdminAuditController } from './admin-audit.controller';
import { AdminUploadService } from './admin-upload.service';
import { AdminStaffService } from './admin-staff.service';
import { AdminStaffController } from './admin-staff.controller';
import { AdminAccessController } from './admin-access.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { AuditModule } from '../audit/audit.module';
import { PaymentsModule } from '../payments/payments.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    AuditModule,
    PaymentsModule,
    ConfigModule,
  ],
  controllers: [
    AdminOrdersController,
    AdminCatalogController,
    AdminAuditController,
    AdminStaffController,
    AdminAccessController,
  ],
  providers: [
    AdminOrdersService,
    AdminCatalogService,
    AdminAuditService,
    AdminUploadService,
    AdminStaffService,
  ],
})
export class AdminModule {}
