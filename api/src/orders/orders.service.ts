import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  forwardRef,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  CatalogStatus,
  DeliveryFeeStatus,
  FulfillmentMethod,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  ProductAvailability,
  Prisma,
  TileSize,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto, UpdateDeliveryAddressDto } from './dto/create-order.dto';
import { isPaymentAllowed, toPublicOrder } from './orders.mapper';
import {
  addMinor,
  fromMinorUnits,
  multiplyMinor,
  toMinorUnits,
} from '../common/money';
import { DeliveryService } from '../delivery/delivery.service';
import { AuditService } from '../audit/audit.service';
import { LocationsService } from '../locations/locations.service';
import { toPublicTileSizeFields } from '../catalog/tile-size';

/** Snapshot catalogue SKU at order time (specsJson.sku, else sku-{code} slug). */
function snapshotProductSku(product: {
  slug: string;
  specsJson: string | null;
}): string {
  if (product.specsJson) {
    try {
      const parsed = JSON.parse(product.specsJson) as { sku?: unknown };
      if (typeof parsed?.sku === 'string' && parsed.sku.trim()) {
        return parsed.sku.trim();
      }
    } catch {
      /* fall through */
    }
  }
  const m = /^sku-(.+)$/i.exec(product.slug.trim());
  if (m) return m[1].toUpperCase();
  return product.slug;
}

const orderInclude = {
  items: true,
  payments: true,
  receipt: true,
} satisfies Prisma.OrderInclude;

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    @Inject(forwardRef(() => DeliveryService))
    private readonly delivery: DeliveryService,
    private readonly audit: AuditService,
    private readonly locations: LocationsService,
  ) {}

  private currency() {
    return this.config.get<string>('PAYMENT_CURRENCY') ||
      this.config.get<string>('CURRENCY_DEFAULT') ||
      'NGN';
  }

  private async nextOrderNumber(tx: Prisma.TransactionClient) {
    const count = await tx.order.count();
    const n = (count + 1).toString().padStart(6, '0');
    return `AWOH-${new Date().getFullYear()}-${n}`;
  }

  async createOrder(userId: string, dto: CreateOrderDto) {
    if (dto.idempotencyKey) {
      const existing = await this.prisma.order.findUnique({
        where: {
          userId_idempotencyKey: {
            userId,
            idempotencyKey: dto.idempotencyKey,
          },
        },
        include: orderInclude,
      });
      if (existing) {
        return toPublicOrder(existing);
      }
    }

    if (
      dto.fulfillmentMethod === FulfillmentMethod.DELIVERY &&
      (!dto.shippingStateId ||
        !dto.shippingLgaId ||
        !dto.shippingTownId ||
        !dto.shippingLine1?.trim())
    ) {
      throw new BadRequestException(
        'Complete delivery address (State, LGA, Town/City, and street address) is required.',
      );
    }

    let deliveryAddress: Awaited<
      ReturnType<LocationsService['resolveValidatedAddress']>
    > | null = null;
    if (dto.fulfillmentMethod === FulfillmentMethod.DELIVERY) {
      deliveryAddress = await this.locations.resolveValidatedAddress({
        stateId: dto.shippingStateId!,
        lgaId: dto.shippingLgaId!,
        townId: dto.shippingTownId!,
        address: dto.shippingLine1!,
        deliveryInstructions: dto.shippingNotes,
      });
    }

    const productIds = [...new Set(dto.items.map((i) => i.productId))];
    const products = await this.prisma.product.findMany({
      where: {
        id: { in: productIds },
        status: CatalogStatus.ACTIVE,
      },
    });
    if (products.length !== productIds.length) {
      throw new BadRequestException('One or more products are unavailable.');
    }

    const productMap = new Map(products.map((p) => [p.id, p]));
    let subtotalMinor = 0n;
    const lineData: Array<{
      productId: string;
      productName: string;
      productSlug: string;
      productSku: string;
      tileSizeLabel: string | null;
      quantity: number;
      unitPrice: string;
      lineTotal: string;
    }> = [];

    for (const line of dto.items) {
      const product = productMap.get(line.productId);
      if (!product) {
        throw new BadRequestException('One or more products are unavailable.');
      }
      if (product.availability !== ProductAvailability.AVAILABLE) {
        throw new BadRequestException(
          `Product "${product.name}" is currently unavailable.`,
        );
      }
      if (!Number.isInteger(line.quantity) || line.quantity < 1) {
        throw new BadRequestException('Invalid quantity.');
      }
      const unitMinor = toMinorUnits(product.price.toString());
      const lineMinor = multiplyMinor(unitMinor, line.quantity);
      subtotalMinor = addMinor(subtotalMinor, lineMinor);
      const tile = toPublicTileSizeFields(product.tileSize as TileSize | null);
      lineData.push({
        productId: product.id,
        productName: product.name,
        productSlug: product.slug,
        productSku: snapshotProductSku(product),
        tileSizeLabel: tile.tileSizeLabel,
        quantity: line.quantity,
        unitPrice: fromMinorUnits(unitMinor),
        lineTotal: fromMinorUnits(lineMinor),
      });
    }

    let deliveryFeeStatus: DeliveryFeeStatus;
    let deliveryFee: Prisma.Decimal | null;
    let deliveryMinor = 0n;
    let deliveryQuoteExpiresAt: Date | null = null;
    let deliveryInternalJson: string | null = null;
    let deliveryConfigId: string | null = null;

    if (dto.fulfillmentMethod === FulfillmentMethod.PICKUP) {
      deliveryFeeStatus = DeliveryFeeStatus.NOT_REQUIRED;
      deliveryFee = new Prisma.Decimal('0.00');
      deliveryMinor = 0n;
    } else {
      const evaluated = await this.delivery.evaluateForOrderLines(
        lineData.map((l) => {
          const product = productMap.get(l.productId)!;
          return {
            productId: l.productId,
            quantity: l.quantity,
            weightPerCartonKg: product.weightPerCartonKg
              ? Number(product.weightPerCartonKg.toString())
              : null,
            productName: l.productName,
          };
        }),
        {
          shippingLine1: deliveryAddress!.shippingLine1,
          shippingCity: deliveryAddress!.shippingCity,
          shippingState: deliveryAddress!.shippingState,
        },
      );
      deliveryFeeStatus = evaluated.status;
      deliveryFee = evaluated.deliveryFee;
      deliveryMinor = evaluated.deliveryMinor;
      deliveryQuoteExpiresAt = evaluated.expiresAt;
      deliveryInternalJson = evaluated.internalJson;
      deliveryConfigId = evaluated.configId;
    }

    const totalMinor = addMinor(subtotalMinor, deliveryMinor);
    const currency = this.currency();

    let orderStatus: OrderStatus;
    if (deliveryFeeStatus === DeliveryFeeStatus.NEEDS_NEGOTIATION) {
      orderStatus = OrderStatus.AWAITING_DELIVERY_CONFIRMATION;
    } else if (dto.paymentMethod === PaymentMethod.OFFLINE_CASH) {
      orderStatus = OrderStatus.AWAITING_OFFLINE_PAYMENT;
    } else {
      orderStatus = OrderStatus.PENDING_PAYMENT;
    }

    try {
      const created = await this.prisma.$transaction(async (tx) => {
        if (dto.idempotencyKey) {
          const again = await tx.order.findUnique({
            where: {
              userId_idempotencyKey: {
                userId,
                idempotencyKey: dto.idempotencyKey,
              },
            },
            include: orderInclude,
          });
          if (again) return again;
        }

        const orderNumber = await this.nextOrderNumber(tx);
        const order = await tx.order.create({
          data: {
            orderNumber,
            userId,
            status: orderStatus,
            fulfillmentMethod: dto.fulfillmentMethod,
            deliveryFeeStatus,
            deliveryFee,
            deliveryQuoteExpiresAt,
            deliveryInternalJson,
            deliveryConfigId,
            subtotal: fromMinorUnits(subtotalMinor),
            total: fromMinorUnits(totalMinor),
            currency,
            contactEmail: dto.contactEmail.trim().toLowerCase(),
            contactPhone: dto.contactPhone?.trim() || null,
            shippingLine1: deliveryAddress?.shippingLine1 ?? null,
            shippingCity: deliveryAddress?.shippingCity ?? null,
            shippingLga: deliveryAddress?.shippingLga ?? null,
            shippingState: deliveryAddress?.shippingState ?? null,
            shippingNotes: deliveryAddress?.shippingNotes ?? null,
            shippingStateId: deliveryAddress?.shippingStateId ?? null,
            shippingLgaId: deliveryAddress?.shippingLgaId ?? null,
            shippingTownId: deliveryAddress?.shippingTownId ?? null,
            idempotencyKey: dto.idempotencyKey || null,
            items: {
              create: lineData,
            },
            payments: {
              create: {
                method: dto.paymentMethod,
                provider:
                  dto.paymentMethod === PaymentMethod.PAYSTACK
                    ? 'paystack'
                    : 'offline',
                amount: fromMinorUnits(totalMinor),
                currency,
                status: PaymentStatus.PENDING,
              },
            },
          },
          include: orderInclude,
        });
        return order;
      });

      await this.audit.log({
        actorUserId: userId,
        action:
          created.fulfillmentMethod === FulfillmentMethod.DELIVERY
            ? 'delivery.quote_requested'
            : 'order.created',
        entityType: 'Order',
        entityId: created.id,
        metadata: {
          deliveryFeeStatus: created.deliveryFeeStatus,
          fulfillmentMethod: created.fulfillmentMethod,
          shippingState: created.shippingState,
          shippingLga: created.shippingLga,
          shippingCity: created.shippingCity,
          hasInternalSnapshot: Boolean(created.deliveryInternalJson),
        },
      });
      if (created.fulfillmentMethod === FulfillmentMethod.DELIVERY) {
        await this.audit.log({
          actorUserId: userId,
          action: 'delivery.address_submitted',
          entityType: 'Order',
          entityId: created.id,
          metadata: {
            shippingState: created.shippingState,
            shippingLga: created.shippingLga,
            shippingCity: created.shippingCity,
          },
        });
      }

      return toPublicOrder(created);
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2002' &&
        dto.idempotencyKey
      ) {
        const existing = await this.prisma.order.findUnique({
          where: {
            userId_idempotencyKey: {
              userId,
              idempotencyKey: dto.idempotencyKey,
            },
          },
          include: orderInclude,
        });
        if (existing) return toPublicOrder(existing);
        throw new ConflictException('Duplicate checkout request.');
      }
      throw err;
    }
  }

  async listForUser(userId: string) {
    const orders = await this.prisma.order.findMany({
      where: { userId },
      include: orderInclude,
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return orders.map(toPublicOrder);
  }

  async getForUser(userId: string, orderId: string) {
    let order = await this.prisma.order.findFirst({
      where: { id: orderId, userId },
      include: orderInclude,
    });
    if (!order) throw new NotFoundException('Order not found.');
    order = await this.ensureDeliveryQuoteVersion(order);
    return toPublicOrder(order);
  }

  /**
   * Fees saved before Stage 09 versioning used deliveryQuoteVersion=0.
   * Promote those to version 1 (unconfirmed) so Pay Now stays locked until
   * the customer explicitly confirms.
   */
  private async ensureDeliveryQuoteVersion<
    T extends {
      id: string;
      fulfillmentMethod: FulfillmentMethod;
      deliveryFeeStatus: DeliveryFeeStatus;
      deliveryFee: { toString(): string } | null;
      deliveryQuoteVersion: number;
    },
  >(order: T): Promise<T> {
    if (
      order.fulfillmentMethod !== FulfillmentMethod.DELIVERY ||
      order.deliveryFee == null ||
      (order.deliveryFeeStatus !== DeliveryFeeStatus.FEE_SET_BY_STAFF &&
        order.deliveryFeeStatus !== DeliveryFeeStatus.QUOTE_AVAILABLE) ||
      (order.deliveryQuoteVersion ?? 0) >= 1
    ) {
      return order;
    }
    return (await this.prisma.order.update({
      where: { id: order.id },
      data: {
        deliveryQuoteVersion: 1,
        deliveryQuoteConfirmedVersion: null,
        deliveryQuoteConfirmedAt: null,
      },
      include: orderInclude,
    })) as unknown as T;
  }

  async getOwnedEntity(userId: string, orderId: string) {
    let order = await this.prisma.order.findFirst({
      where: { id: orderId, userId },
      include: orderInclude,
    });
    if (!order) throw new NotFoundException('Order not found.');
    order = await this.ensureDeliveryQuoteVersion(order);
    return order;
  }

  /**
   * Customer updates delivery destination on an unpaid delivery order.
   * Invalidates any prior staff quote / customer confirmation.
   */
  async updateDeliveryAddress(
    userId: string,
    orderId: string,
    dto: UpdateDeliveryAddressDto,
    ip?: string,
  ) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, userId },
      include: orderInclude,
    });
    if (!order) throw new NotFoundException('Order not found.');
    if (order.fulfillmentMethod !== FulfillmentMethod.DELIVERY) {
      throw new BadRequestException('Order is not a delivery order.');
    }
    if (
      order.status === OrderStatus.PAID ||
      order.status === OrderStatus.CANCELLED
    ) {
      throw new BadRequestException(
        'Delivery address cannot be changed for this order.',
      );
    }

    const address = await this.locations.resolveValidatedAddress({
      stateId: dto.shippingStateId,
      lgaId: dto.shippingLgaId,
      townId: dto.shippingTownId,
      address: dto.shippingLine1,
      deliveryInstructions: dto.shippingNotes,
    });

    const evaluated = await this.delivery.evaluateForOrderLines(
      order.items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        weightPerCartonKg: null,
        productName: item.productName,
      })),
      {
        shippingLine1: address.shippingLine1,
        shippingCity: address.shippingCity,
        shippingState: address.shippingState,
      },
    );

    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.payment.updateMany({
        where: {
          orderId: order.id,
          status: {
            in: [PaymentStatus.PENDING, PaymentStatus.PROCESSING],
          },
        },
        data: { status: PaymentStatus.CANCELLED },
      });

      await tx.order.update({
        where: { id: order.id },
        data: {
          ...address,
          deliveryFee: null,
          deliveryFeeStatus: DeliveryFeeStatus.NEEDS_NEGOTIATION,
          deliveryQuoteExpiresAt: null,
          deliveryQuoteVersion: 0,
          deliveryQuoteConfirmedVersion: null,
          deliveryQuoteConfirmedAt: null,
          deliveryInternalJson: evaluated.internalJson,
          deliveryConfigId: evaluated.configId,
          total: order.subtotal,
          status: OrderStatus.AWAITING_DELIVERY_CONFIRMATION,
        },
      });

      await tx.payment.create({
        data: {
          orderId: order.id,
          method: order.payments[0]?.method ?? PaymentMethod.PAYSTACK,
          provider: order.payments[0]?.provider ?? 'paystack',
          amount: order.subtotal,
          currency: order.currency,
          status: PaymentStatus.PENDING,
        },
      });

      return tx.order.findUniqueOrThrow({
        where: { id: order.id },
        include: orderInclude,
      });
    });

    await this.audit.log({
      actorUserId: userId,
      action: 'delivery.address_updated',
      entityType: 'Order',
      entityId: order.id,
      ip,
      metadata: {
        shippingState: address.shippingState,
        shippingLga: address.shippingLga,
        shippingCity: address.shippingCity,
        previousQuoteInvalidated: true,
      },
    });

    return toPublicOrder(updated);
  }

  /**
   * Customer explicitly accepts the current staff-entered delivery quote.
   * Payment remains blocked until this succeeds against the current quote version.
   */
  async acceptDeliveryQuote(userId: string, orderId: string, ip?: string) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, userId },
      include: orderInclude,
    });
    if (!order) throw new NotFoundException('Order not found.');
    if (order.fulfillmentMethod !== FulfillmentMethod.DELIVERY) {
      throw new BadRequestException('Order is not a delivery order.');
    }
    if (
      order.status === OrderStatus.PAID ||
      order.status === OrderStatus.CANCELLED
    ) {
      throw new BadRequestException('Order is not eligible for quote confirmation.');
    }

    const status = order.deliveryFeeStatus;
    if (
      status === DeliveryFeeStatus.EXPIRED ||
      (order.deliveryQuoteExpiresAt &&
        order.deliveryQuoteExpiresAt.getTime() <= Date.now())
    ) {
      throw new BadRequestException(
        'Your delivery quote has expired. Please contact Sales Staff for an updated quote.',
      );
    }
    if (
      status !== DeliveryFeeStatus.QUOTE_AVAILABLE &&
      status !== DeliveryFeeStatus.FEE_SET_BY_STAFF
    ) {
      throw new BadRequestException(
        'Please contact our Sales Staff for your delivery quote.',
      );
    }
    if (order.deliveryFee == null) {
      throw new BadRequestException(
        'Please contact our Sales Staff for your delivery quote.',
      );
    }

    // Legacy fees set before quote-versioning used version 0 — promote so confirm can arm payment.
    let version = order.deliveryQuoteVersion ?? 0;
    if (version < 1) {
      await this.prisma.order.update({
        where: { id: order.id },
        data: {
          deliveryQuoteVersion: 1,
          deliveryQuoteConfirmedVersion: null,
          deliveryQuoteConfirmedAt: null,
        },
      });
      version = 1;
    }

    if (order.deliveryQuoteConfirmedVersion === version) {
      const current = await this.prisma.order.findFirstOrThrow({
        where: { id: order.id, userId },
        include: orderInclude,
      });
      return toPublicOrder(current);
    }

    const updated = await this.prisma.order.update({
      where: { id: order.id },
      data: {
        deliveryQuoteVersion: version,
        deliveryQuoteConfirmedVersion: version,
        deliveryQuoteConfirmedAt: new Date(),
      },
      include: orderInclude,
    });

    await this.audit.log({
      actorUserId: userId,
      action: 'delivery.customer_confirm_quote',
      entityType: 'Order',
      entityId: order.id,
      ip,
      metadata: {
        deliveryQuoteVersion: version,
        deliveryFee: order.deliveryFee.toString(),
        total: order.total.toString(),
      },
    });

    return toPublicOrder(updated);
  }

  assertPayable(
    order: {
      id?: string;
      userId: string;
      deliveryFeeStatus: DeliveryFeeStatus;
      deliveryQuoteExpiresAt?: Date | null;
      deliveryQuoteVersion?: number | null;
      deliveryQuoteConfirmedVersion?: number | null;
      deliveryFee?: { toString(): string } | string | null;
      status: OrderStatus;
    },
    userId: string,
  ) {
    if (order.userId !== userId) {
      throw new ForbiddenException('Order access denied.');
    }
    if (
      order.status === OrderStatus.PAID ||
      order.status === OrderStatus.CANCELLED
    ) {
      throw new BadRequestException('Payment is not available for this order.');
    }
    if (!isPaymentAllowed(order)) {
      if (order.id) {
        void this.audit
          .log({
            actorUserId: userId,
            action: 'payment.blocked_delivery_quote',
            entityType: 'Order',
            entityId: order.id,
            metadata: {
              deliveryFeeStatus: order.deliveryFeeStatus,
              deliveryQuoteVersion: order.deliveryQuoteVersion ?? 0,
              deliveryQuoteConfirmedVersion:
                order.deliveryQuoteConfirmedVersion ?? null,
            },
          })
          .catch(() => undefined);
      }
      throw new BadRequestException(
        'Delivery quote must be confirmed before payment is available.',
      );
    }
  }
}
