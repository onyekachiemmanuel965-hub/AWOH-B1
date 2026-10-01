import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { AuditModule } from '../audit/audit.module';
import { CommonModule } from '../common/common.module';
import { AdminUploadService } from '../admin/admin-upload.service';
import { StorefrontImagesService } from './storefront-images.service';
import { StorefrontImagesController } from './storefront-images.controller';
import { AdminStorefrontImagesController } from './admin-storefront-images.controller';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    AuditModule,
    CommonModule,
    ConfigModule,
  ],
  controllers: [StorefrontImagesController, AdminStorefrontImagesController],
  providers: [StorefrontImagesService, AdminUploadService],
  exports: [StorefrontImagesService],
})
export class ContentModule {}
