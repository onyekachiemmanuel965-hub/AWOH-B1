import {
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Patch,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import type { Request } from 'express';
import { StorefrontImagesService } from './storefront-images.service';
import { PRODUCT_IMAGE_MAX_BYTES } from '../admin/admin-upload.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OriginGuard } from '../auth/guards/origin.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUserPayload } from '../auth/guards/jwt-auth.guard';
import { ROLE_CODES } from '../auth/auth.constants';
import { InMemoryRateLimiter } from '../common/in-memory-rate-limiter';

@Controller('api/v1/admin/storefront-images')
@UseGuards(OriginGuard, JwtAuthGuard, RolesGuard)
@Roles(ROLE_CODES.ADMIN, ROLE_CODES.CONTENT_MANAGER)
@RequirePermissions('content.manage')
export class AdminStorefrontImagesController {
  constructor(
    private readonly images: StorefrontImagesService,
    private readonly rateLimiter: InMemoryRateLimiter,
  ) {}

  @Get()
  list() {
    return this.images.listAdmin();
  }

  @Post(':key/upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: PRODUCT_IMAGE_MAX_BYTES },
    }),
  )
  async upload(
    @CurrentUser() user: AuthUserPayload,
    @Param('key') key: string,
    @UploadedFile() file: Express.Multer.File,
    @Body('altText') altText: string | undefined,
    @Req() req: Request,
  ) {
    if (
      !this.rateLimiter.attempt(
        `storefront-upload:${user.userId}`,
        20,
        60_000,
      )
    ) {
      throw new HttpException(
        'Too many uploads. Try again shortly.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    return this.images.upload(
      user.userId,
      decodeURIComponent(key),
      file,
      altText,
      req.ip,
    );
  }

  @Patch(':key')
  updateMeta(
    @CurrentUser() user: AuthUserPayload,
    @Param('key') key: string,
    @Body() body: { altText?: string },
    @Req() req: Request,
  ) {
    return this.images.updateMeta(
      user.userId,
      decodeURIComponent(key),
      body?.altText,
      req.ip,
    );
  }

  @Delete(':key')
  clear(
    @CurrentUser() user: AuthUserPayload,
    @Param('key') key: string,
    @Req() req: Request,
  ) {
    return this.images.clear(user.userId, decodeURIComponent(key), req.ip);
  }
}
