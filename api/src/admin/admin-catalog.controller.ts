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
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Request } from 'express';
import { memoryStorage } from 'multer';
import { AdminCatalogService } from './admin-catalog.service';
import { AdminUploadService } from './admin-upload.service';
import {
  AdminProductsQueryDto,
  CreateCategoryDto,
  CreateProductDto,
  CreateSubcategoryDto,
  UpdateCategoryDto,
  UpdateInventoryDto,
  UpdateProductContentDto,
  UpdateProductPriceDto,
  UpdateSubcategoryDto,
} from './dto/admin.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OriginGuard } from '../auth/guards/origin.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUserPayload } from '../auth/guards/jwt-auth.guard';
import { ROLE_CODES } from '../auth/auth.constants';
import { PrismaService } from '../prisma/prisma.service';
import { InMemoryRateLimiter } from '../common/in-memory-rate-limiter';

@Controller('api/v1/admin')
@UseGuards(OriginGuard, JwtAuthGuard, RolesGuard)
export class AdminCatalogController {
  constructor(
    private readonly catalog: AdminCatalogService,
    private readonly uploads: AdminUploadService,
    private readonly prisma: PrismaService,
    private readonly rateLimiter: InMemoryRateLimiter,
  ) {}

  private async roleCode(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });
    return user?.role.code ?? ROLE_CODES.CUSTOMER;
  }

  @Get('categories')
  @Roles(
    ROLE_CODES.ADMIN,
    ROLE_CODES.CONTENT_MANAGER,
    ROLE_CODES.INVENTORY_MANAGER,
    ROLE_CODES.SALES_STAFF,
  )
  @RequirePermissions('products.read')
  listCategories() {
    return this.catalog.listCategories();
  }

  @Post('categories')
  @Roles(ROLE_CODES.ADMIN, ROLE_CODES.CONTENT_MANAGER)
  @RequirePermissions('content.manage')
  createCategory(
    @CurrentUser() user: AuthUserPayload,
    @Body() dto: CreateCategoryDto,
    @Req() req: Request,
  ) {
    return this.catalog.createCategory(user.userId, dto, req.ip);
  }

  @Patch('categories/:id')
  @Roles(ROLE_CODES.ADMIN, ROLE_CODES.CONTENT_MANAGER)
  @RequirePermissions('content.manage')
  updateCategory(
    @CurrentUser() user: AuthUserPayload,
    @Param('id') id: string,
    @Body() dto: UpdateCategoryDto,
    @Req() req: Request,
  ) {
    return this.catalog.updateCategory(user.userId, id, dto, req.ip);
  }

  @Post('categories/:id/deactivate')
  @Roles(ROLE_CODES.ADMIN, ROLE_CODES.CONTENT_MANAGER)
  @RequirePermissions('content.manage')
  deactivateCategory(
    @CurrentUser() user: AuthUserPayload,
    @Param('id') id: string,
    @Req() req: Request,
  ) {
    return this.catalog.deactivateCategory(user.userId, id, req.ip);
  }

  @Get('subcategories')
  @Roles(
    ROLE_CODES.ADMIN,
    ROLE_CODES.CONTENT_MANAGER,
    ROLE_CODES.INVENTORY_MANAGER,
    ROLE_CODES.SALES_STAFF,
  )
  @RequirePermissions('products.read')
  listSubcategories(@Query('categoryId') categoryId?: string) {
    return this.catalog.listSubcategories(categoryId);
  }

  @Post('subcategories')
  @Roles(ROLE_CODES.ADMIN, ROLE_CODES.CONTENT_MANAGER)
  @RequirePermissions('content.manage')
  createSubcategory(
    @CurrentUser() user: AuthUserPayload,
    @Body() dto: CreateSubcategoryDto,
    @Req() req: Request,
  ) {
    return this.catalog.createSubcategory(user.userId, dto, req.ip);
  }

  @Patch('subcategories/:id')
  @Roles(ROLE_CODES.ADMIN, ROLE_CODES.CONTENT_MANAGER)
  @RequirePermissions('content.manage')
  updateSubcategory(
    @CurrentUser() user: AuthUserPayload,
    @Param('id') id: string,
    @Body() dto: UpdateSubcategoryDto,
    @Req() req: Request,
  ) {
    return this.catalog.updateSubcategory(user.userId, id, dto, req.ip);
  }

  @Post('subcategories/:id/deactivate')
  @Roles(ROLE_CODES.ADMIN, ROLE_CODES.CONTENT_MANAGER)
  @RequirePermissions('content.manage')
  deactivateSubcategory(
    @CurrentUser() user: AuthUserPayload,
    @Param('id') id: string,
    @Req() req: Request,
  ) {
    return this.catalog.deactivateSubcategory(user.userId, id, req.ip);
  }

  @Get('products')
  @Roles(
    ROLE_CODES.ADMIN,
    ROLE_CODES.CONTENT_MANAGER,
    ROLE_CODES.INVENTORY_MANAGER,
    ROLE_CODES.SALES_STAFF,
  )
  @RequirePermissions('products.read')
  async listProducts(
    @CurrentUser() user: AuthUserPayload,
    @Query() query: AdminProductsQueryDto,
  ) {
    const role = await this.roleCode(user.userId);
    return this.catalog.listProducts(query, role);
  }

  @Get('products/:id')
  @Roles(
    ROLE_CODES.ADMIN,
    ROLE_CODES.CONTENT_MANAGER,
    ROLE_CODES.INVENTORY_MANAGER,
    ROLE_CODES.SALES_STAFF,
  )
  @RequirePermissions('products.read')
  async getProduct(
    @CurrentUser() user: AuthUserPayload,
    @Param('id') id: string,
  ) {
    const role = await this.roleCode(user.userId);
    return this.catalog.getProduct(id, role);
  }

  @Post('products')
  @Roles(ROLE_CODES.ADMIN, ROLE_CODES.CONTENT_MANAGER)
  @RequirePermissions('products.manage')
  async createProduct(
    @CurrentUser() user: AuthUserPayload,
    @Body() dto: CreateProductDto,
    @Req() req: Request,
  ) {
    const role = await this.roleCode(user.userId);
    return this.catalog.createProduct(user.userId, dto, req.ip, {
      // CONTENT_MANAGER must not set authoritative stock/weight on create
      allowInventoryFields: role === ROLE_CODES.ADMIN,
    });
  }

  @Patch('products/:id')
  @Roles(ROLE_CODES.ADMIN, ROLE_CODES.CONTENT_MANAGER)
  @RequirePermissions('products.manage')
  updateProduct(
    @CurrentUser() user: AuthUserPayload,
    @Param('id') id: string,
    @Body() dto: UpdateProductContentDto,
    @Req() req: Request,
  ) {
    return this.catalog.updateProductContent(user.userId, id, dto, req.ip);
  }

  @Patch('products/:id/price')
  @Roles(ROLE_CODES.ADMIN)
  @RequirePermissions('products.manage')
  updatePrice(
    @CurrentUser() user: AuthUserPayload,
    @Param('id') id: string,
    @Body() dto: UpdateProductPriceDto,
    @Req() req: Request,
  ) {
    return this.catalog.updateProductPrice(user.userId, id, dto, req.ip);
  }

  @Patch('products/:id/inventory')
  @Roles(ROLE_CODES.ADMIN, ROLE_CODES.INVENTORY_MANAGER)
  @RequirePermissions('inventory.manage')
  updateInventory(
    @CurrentUser() user: AuthUserPayload,
    @Param('id') id: string,
    @Body() dto: UpdateInventoryDto,
    @Req() req: Request,
  ) {
    return this.catalog.updateInventory(user.userId, id, dto, req.ip);
  }

  @Post('products/:id/deactivate')
  @Roles(ROLE_CODES.ADMIN, ROLE_CODES.CONTENT_MANAGER)
  @RequirePermissions('products.manage')
  deactivateProduct(
    @CurrentUser() user: AuthUserPayload,
    @Param('id') id: string,
    @Req() req: Request,
  ) {
    return this.catalog.deactivateProduct(user.userId, id, req.ip);
  }

  @Post('products/:id/images')
  @Roles(ROLE_CODES.ADMIN, ROLE_CODES.CONTENT_MANAGER)
  @RequirePermissions('products.manage')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  async uploadImage(
    @CurrentUser() user: AuthUserPayload,
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @Req() req: Request,
  ) {
    if (
      !this.rateLimiter.attempt(`upload:${user.userId}`, 30, 15 * 60 * 1000)
    ) {
      throw new HttpException(
        'Too many uploads. Please try again later.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    const url = await this.uploads.saveProductImage(file);
    return this.catalog.addImage(user.userId, id, url, undefined, req.ip);
  }

  @Delete('products/:productId/images/:imageId')
  @Roles(ROLE_CODES.ADMIN, ROLE_CODES.CONTENT_MANAGER)
  @RequirePermissions('products.manage')
  removeImage(
    @CurrentUser() user: AuthUserPayload,
    @Param('productId') productId: string,
    @Param('imageId') imageId: string,
    @Req() req: Request,
  ) {
    return this.catalog.removeImage(user.userId, productId, imageId, req.ip);
  }

  @Post('products/:productId/images/:imageId/primary')
  @Roles(ROLE_CODES.ADMIN, ROLE_CODES.CONTENT_MANAGER)
  @RequirePermissions('products.manage')
  setPrimary(
    @CurrentUser() user: AuthUserPayload,
    @Param('productId') productId: string,
    @Param('imageId') imageId: string,
    @Req() req: Request,
  ) {
    return this.catalog.setPrimaryImage(
      user.userId,
      productId,
      imageId,
      req.ip,
    );
  }

  @Get('inventory')
  @Roles(ROLE_CODES.ADMIN, ROLE_CODES.INVENTORY_MANAGER)
  @RequirePermissions('inventory.read')
  async inventory(@Query() query: AdminProductsQueryDto) {
    return this.catalog.listProducts(query, ROLE_CODES.INVENTORY_MANAGER);
  }
}
