import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsIn,
  IsInt,
  IsNumberString,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import {
  CatalogStatus,
  DeliveryFeeStatus,
  FulfillmentMethod,
  OrderStatus,
  PaymentStatus,
  ProductAvailability,
  TileSize,
  UserStatus,
} from '@prisma/client';
import { ROLE_CODES } from '../../auth/auth.constants';

export class AdminOrdersQueryDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit?: number = 20;

  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;

  @IsOptional()
  @IsEnum(PaymentStatus)
  paymentStatus?: PaymentStatus;

  @IsOptional()
  @IsEnum(FulfillmentMethod)
  fulfillmentMethod?: FulfillmentMethod;

  @IsOptional()
  @IsEnum(DeliveryFeeStatus)
  deliveryFeeStatus?: DeliveryFeeStatus;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  q?: string;
}

export class ConfirmOfflineDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}

export class CreateCategoryDto {
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  slug?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  imageUrl?: string;

  @IsOptional()
  @IsEnum(CatalogStatus)
  status?: CatalogStatus;

  @Type(() => Number)
  @IsInt()
  @IsOptional()
  sortOrder?: number;
}

export class UpdateCategoryDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  slug?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  imageUrl?: string | null;

  @IsOptional()
  @IsEnum(CatalogStatus)
  status?: CatalogStatus;

  @Type(() => Number)
  @IsInt()
  @IsOptional()
  sortOrder?: number;
}

export class CreateSubcategoryDto {
  @IsString()
  @MinLength(1)
  categoryId!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  slug?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  imageUrl?: string;

  @IsOptional()
  @IsEnum(CatalogStatus)
  status?: CatalogStatus;

  @Type(() => Number)
  @IsInt()
  @IsOptional()
  sortOrder?: number;
}

export class UpdateSubcategoryDto {
  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  slug?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  imageUrl?: string | null;

  @IsOptional()
  @IsEnum(CatalogStatus)
  status?: CatalogStatus;

  @Type(() => Number)
  @IsInt()
  @IsOptional()
  sortOrder?: number;
}

export class CreateProductDto {
  @IsString()
  subcategoryId!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(200)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  slug?: string;

  @IsString()
  @MinLength(1)
  @MaxLength(10000)
  description!: string;

  @IsNumberString()
  price!: string;

  @IsOptional()
  @IsEnum(CatalogStatus)
  status?: CatalogStatus;

  @IsOptional()
  @IsEnum(ProductAvailability)
  availability?: ProductAvailability;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  @IsOptional()
  stockQuantity?: number;

  @IsOptional()
  @IsNumberString()
  weightPerCartonKg?: string;

  /** Required physical tile size — content field (ADMIN / CONTENT_MANAGER). */
  @IsEnum(TileSize)
  tileSize!: TileSize;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  specsJson?: string;

  @IsOptional()
  @IsBoolean()
  featured?: boolean;

  @Type(() => Number)
  @IsInt()
  @IsOptional()
  sortOrder?: number;

  /** Initial image URL (placeholder or uploaded path). At least one image required. */
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  imageUrl!: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  imageAltText?: string;
}

export class UpdateProductContentDto {
  @IsOptional()
  @IsString()
  subcategoryId?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  slug?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(10000)
  description?: string;

  @IsOptional()
  @IsEnum(CatalogStatus)
  status?: CatalogStatus;

  @IsOptional()
  @IsBoolean()
  featured?: boolean;

  @Type(() => Number)
  @IsInt()
  @IsOptional()
  sortOrder?: number;

  @IsOptional()
  @IsEnum(TileSize)
  tileSize?: TileSize;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  specsJson?: string | null;
}

export class UpdateProductPriceDto {
  @IsNumberString()
  price!: string;
}

export class UpdateInventoryDto {
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @IsOptional()
  stockQuantity?: number;

  @IsOptional()
  @IsEnum(ProductAvailability)
  availability?: ProductAvailability;

  @IsOptional()
  @IsNumberString()
  weightPerCartonKg?: string | null;
}

export class AdminProductsQueryDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit?: number = 20;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  q?: string;

  @IsOptional()
  @IsEnum(CatalogStatus)
  status?: CatalogStatus;

  @IsOptional()
  @IsEnum(ProductAvailability)
  availability?: ProductAvailability;
}

export class AuditQueryDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit?: number = 30;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  action?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  entityType?: string;
}

export class ReorderImagesDto {
  @IsString({ each: true })
  imageIds!: string[];
}

const STAFF_ROLE_VALUES = Object.values(ROLE_CODES);

export class StaffListQueryDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit?: number = 20;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  q?: string;

  @IsOptional()
  @IsIn(STAFF_ROLE_VALUES)
  role?: string;

  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;
}

export class UpdateStaffRoleDto {
  @IsIn(STAFF_ROLE_VALUES)
  role!: string;
}

export class UpdateStaffStatusDto {
  @IsBoolean()
  isActive!: boolean;
}
