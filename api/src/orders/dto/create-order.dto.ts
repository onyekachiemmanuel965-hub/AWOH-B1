import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsEmail,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { FulfillmentMethod, PaymentMethod } from '@prisma/client';

export class CheckoutLineDto {
  @IsString()
  @MinLength(1)
  @MaxLength(64)
  productId!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(99)
  quantity!: number;
}

export class CreateOrderDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => CheckoutLineDto)
  items!: CheckoutLineDto[];

  @IsEnum(FulfillmentMethod)
  fulfillmentMethod!: FulfillmentMethod;

  @IsEnum(PaymentMethod)
  paymentMethod!: PaymentMethod;

  @IsEmail()
  @MaxLength(254)
  contactEmail!: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  contactPhone?: string;

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

  @IsOptional()
  @IsString()
  @MaxLength(500)
  shippingNotes?: string;

  /** Client idempotency key to prevent duplicate orders on retry. */
  @IsOptional()
  @IsString()
  @MinLength(8)
  @MaxLength(120)
  idempotencyKey?: string;
}
