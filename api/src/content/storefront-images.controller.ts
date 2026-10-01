import { Controller, Get, Param, Query } from '@nestjs/common';
import { StorefrontImagesService } from './storefront-images.service';

@Controller('api/v1/storefront-images')
export class StorefrontImagesController {
  constructor(private readonly images: StorefrontImagesService) {}

  @Get()
  list(@Query('page') page?: string) {
    return this.images.listPublic(page?.trim() || undefined);
  }

  @Get(':key')
  one(@Param('key') key: string) {
    return this.images.getPublic(decodeURIComponent(key));
  }
}
