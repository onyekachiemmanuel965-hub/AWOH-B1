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
  ValidateIf,
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

  /** Required for DELIVERY — validated against NigState / NigLga / NigTown. */
  @ValidateIf((o: CreateOrderDto) => o.fulfillmentMethod === FulfillmentMethod.DELIVERY)
  @IsString()
  @MinLength(1)
  @MaxLength(64)
  shippingStateId?: string;

  @ValidateIf((o: CreateOrderDto) => o.fulfillmentMethod === FulfillmentMethod.DELIVERY)
  @IsString()
  @MinLength(1)
  @MaxLength(64)
  shippingLgaId?: string;

  @ValidateIf((o: CreateOrderDto) => o.fulfillmentMethod === FulfillmentMethod.DELIVERY)
  @IsString()
  @MinLength(1)
  @MaxLength(64)
  shippingTownId?: string;

  @ValidateIf((o: CreateOrderDto) => o.fulfillmentMethod === FulfillmentMethod.DELIVERY)
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  shippingLine1?: string;

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

export class UpdateDeliveryAddressDto {
  @IsString()
  @MinLength(1)
  @MaxLength(64)
  shippingStateId!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(64)
  shippingLgaId!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(64)
  shippingTownId!: string;

  @IsString()
  @MinLength(3)
  @MaxLength(200)
  shippingLine1!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  shippingNotes?: string;
}
