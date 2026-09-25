import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

export class QuoteLineDto {
  @IsString()
  @MinLength(1)
  @MaxLength(64)
  productId!: string;

  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(99)
  quantity!: number;
}

/** Customer quote request — monetary/weight/distance fields are rejected by whitelist. */
export class DeliveryQuoteDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => QuoteLineDto)
  items!: QuoteLineDto[];

  @IsOptional()
  @IsString()
  @MaxLength(200)
  shippingLine1?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  shippingCity?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  shippingState?: string;
}

export class ConfirmDeliveryDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}

export class OverrideDeliveryDto {
  @IsString()
  @MinLength(1)
  @MaxLength(32)
  deliveryFee!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
