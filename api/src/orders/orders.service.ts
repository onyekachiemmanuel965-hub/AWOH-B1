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
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { isPaymentAllowed, toPublicOrder } from './orders.mapper';
import {
  addMinor,
  fromMinorUnits,
  multiplyMinor,
  toMinorUnits,
} from '../common/money';
import { DeliveryService } from '../delivery/delivery.service';
import { AuditService } from '../audit/audit.service';

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
      !dto.shippingLine1?.trim()
    ) {
      throw new BadRequestException(
        'Delivery address is required for delivery orders.',
      );
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
      lineData.push({
        productId: product.id,
        productName: product.name,
        productSlug: product.slug,
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
          shippingLine1: dto.shippingLine1,
          shippingCity: dto.shippingCity,
          shippingState: dto.shippingState,
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
            shippingLine1: dto.shippingLine1?.trim() || null,
            shippingCity: dto.shippingCity?.trim() || null,
            shippingState: dto.shippingState?.trim() || null,
            shippingNotes: dto.shippingNotes?.trim() || null,
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
        action: 'delivery.quote_created',
        entityType: 'Order',
        entityId: created.id,
        metadata: {
          deliveryFeeStatus: created.deliveryFeeStatus,
          // Never log raw weight tables to customer-visible channels; audit is internal.
          hasInternalSnapshot: Boolean(created.deliveryInternalJson),
        },
      });

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
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, userId },
      include: orderInclude,
    });
    if (!order) throw new NotFoundException('Order not found.');
    return toPublicOrder(order);
  }

  async getOwnedEntity(userId: string, orderId: string) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, userId },
      include: orderInclude,
    });
    if (!order) throw new NotFoundException('Order not found.');
    return order;
  }

  assertPayable(
    order: {
      userId: string;
      deliveryFeeStatus: DeliveryFeeStatus;
      deliveryQuoteExpiresAt?: Date | null;
      status: OrderStatus;
    },
    userId: string,
  ) {
    if (order.userId !== userId) {
      throw new ForbiddenException('Order access denied.');
    }
    if (!isPaymentAllowed(order)) {
      throw new BadRequestException(
        'Please contact AWOH-B to discuss your delivery fee before payment.',
      );
    }
    if (
      order.status === OrderStatus.PAID ||
      order.status === OrderStatus.CANCELLED
    ) {
      throw new BadRequestException('Payment is not available for this order.');
    }
  }
}
