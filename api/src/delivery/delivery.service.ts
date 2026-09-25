import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  CatalogStatus,
  DeliveryFeeStatus,
  FulfillmentMethod,
  OrderStatus,
  PaymentStatus,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import {
  DISTANCE_PROVIDER,
  type DistanceProvider,
} from './distance-provider';
import {
  calculateDeliveryQuote,
  toCustomerDeliveryDto,
} from './delivery.calculator';
import {
  ConfirmDeliveryDto,
  DeliveryQuoteDto,
  OverrideDeliveryDto,
} from './dto/delivery.dto';
import {
  addMinor,
  fromMinorUnits,
  toMinorUnits,
} from '../common/money';
import { toPublicOrder } from '../orders/orders.mapper';

const orderInclude = {
  items: true,
  payments: true,
  receipt: true,
} satisfies Prisma.OrderInclude;

@Injectable()
export class DeliveryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly audit: AuditService,
    @Inject(DISTANCE_PROVIDER) private readonly distance: DistanceProvider,
  ) {}

  private currency() {
    return (
      this.config.get<string>('PAYMENT_CURRENCY') ||
      this.config.get<string>('CURRENCY_DEFAULT') ||
      'NGN'
    );
  }

  private customerMessage(status: DeliveryFeeStatus): string {
    switch (status) {
      case DeliveryFeeStatus.NEEDS_NEGOTIATION:
      case DeliveryFeeStatus.UNCONFIRMED:
      case DeliveryFeeStatus.EXPIRED:
        return 'Please contact AWOH-B to discuss your delivery fee before payment.';
      case DeliveryFeeStatus.QUOTE_AVAILABLE:
      case DeliveryFeeStatus.FEE_SET_BY_STAFF:
        return 'Delivery fee confirmed.';
      case DeliveryFeeStatus.NOT_REQUIRED:
        return 'Pickup selected — delivery fee not required.';
      default:
        return 'Delivery status unavailable.';
    }
  }

  async getActiveConfig() {
    let cfg = await this.prisma.deliveryConfig.findFirst({
      where: { active: true },
      orderBy: { updatedAt: 'desc' },
    });
    if (!cfg) {
      // Development fallback only — values are provisional config defaults,
      // not approved final AWOH-B production pricing policy.
      const rate =
        this.config.get<string>('DELIVERY_DEFAULT_DISTANCE_RATE') || '500.00';
      cfg = await this.prisma.deliveryConfig.create({
        data: {
          name: 'Provisional development delivery config',
          currency: this.currency(),
          ratePerKm: rate,
          weightFactorPerKg: '0',
          minFee: '0',
          maxFee: null,
          negotiationThreshold: '250000.00',
          quoteTtlMinutes: 120,
          active: true,
        },
      });
    }
    return cfg;
  }

  /**
   * Pre-checkout quote using cart lines + address (no order yet).
   * Client-submitted weight/fee/distance fields are not on DTO (whitelist).
   */
  async quotePreview(dto: DeliveryQuoteDto) {
    const products = await this.prisma.product.findMany({
      where: {
        id: { in: dto.items.map((i) => i.productId) },
        status: CatalogStatus.ACTIVE,
      },
    });
    if (products.length !== dto.items.length) {
      throw new BadRequestException('One or more products are unavailable.');
    }
    const map = new Map(products.map((p) => [p.id, p]));
    const lines = dto.items.map((item) => {
      const product = map.get(item.productId)!;
      return {
        productId: product.id,
        quantity: item.quantity,
        weightPerCartonKg: product.weightPerCartonKg
          ? Number(product.weightPerCartonKg.toString())
          : null,
        productName: product.name,
      };
    });

    const cfg = await this.getActiveConfig();
    const dist = await this.distance.resolveDistance({
      shippingLine1: dto.shippingLine1,
      shippingCity: dto.shippingCity,
      shippingState: dto.shippingState,
    });

    const calc = calculateDeliveryQuote(lines, dist.distanceKm, {
      ratePerKm: Number(cfg.ratePerKm.toString()),
      weightFactorPerKg: Number(cfg.weightFactorPerKg.toString()),
      minFee: Number(cfg.minFee.toString()),
      maxFee: cfg.maxFee ? Number(cfg.maxFee.toString()) : null,
      negotiationThreshold: cfg.negotiationThreshold
        ? Number(cfg.negotiationThreshold.toString())
        : null,
    });

    const status =
      calc.status === 'QUOTE_AVAILABLE'
        ? DeliveryFeeStatus.QUOTE_AVAILABLE
        : DeliveryFeeStatus.NEEDS_NEGOTIATION;

    return toCustomerDeliveryDto(
      status,
      status === DeliveryFeeStatus.QUOTE_AVAILABLE && calc.appliedFee != null
        ? calc.appliedFee.toFixed(2)
        : null,
      cfg.currency,
      this.customerMessage(status),
    );
  }

  /**
   * Used during order creation for DELIVERY fulfillment.
   */
  async evaluateForOrderLines(
    lines: Array<{
      productId: string;
      quantity: number;
      weightPerCartonKg: number | null;
      productName: string;
    }>,
    shipping: {
      shippingLine1?: string | null;
      shippingCity?: string | null;
      shippingState?: string | null;
    },
  ) {
    const cfg = await this.getActiveConfig();
    const dist = await this.distance.resolveDistance(shipping);
    const calc = calculateDeliveryQuote(lines, dist.distanceKm, {
      ratePerKm: Number(cfg.ratePerKm.toString()),
      weightFactorPerKg: Number(cfg.weightFactorPerKg.toString()),
      minFee: Number(cfg.minFee.toString()),
      maxFee: cfg.maxFee ? Number(cfg.maxFee.toString()) : null,
      negotiationThreshold: cfg.negotiationThreshold
        ? Number(cfg.negotiationThreshold.toString())
        : null,
    });

    const status =
      calc.status === 'QUOTE_AVAILABLE'
        ? DeliveryFeeStatus.QUOTE_AVAILABLE
        : DeliveryFeeStatus.NEEDS_NEGOTIATION;

    const expiresAt =
      status === DeliveryFeeStatus.QUOTE_AVAILABLE
        ? new Date(Date.now() + cfg.quoteTtlMinutes * 60_000)
        : null;

    return {
      status,
      deliveryFee:
        status === DeliveryFeeStatus.QUOTE_AVAILABLE && calc.appliedFee != null
          ? new Prisma.Decimal(calc.appliedFee.toFixed(2))
          : null,
      deliveryMinor:
        status === DeliveryFeeStatus.QUOTE_AVAILABLE && calc.appliedFee != null
          ? toMinorUnits(calc.appliedFee.toFixed(2))
          : 0n,
      expiresAt,
      configId: cfg.id,
      internalJson: JSON.stringify({
        ...calc,
        distanceProvider: dist.provider,
        configId: cfg.id,
        configRatePerKm: cfg.ratePerKm.toString(),
      }),
    };
  }

  async getCustomerDelivery(userId: string, orderId: string) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, userId },
    });
    if (!order) throw new NotFoundException('Order not found.');

    const effective = this.effectiveStatus(order);
    return toCustomerDeliveryDto(
      effective,
      effective === DeliveryFeeStatus.QUOTE_AVAILABLE ||
        effective === DeliveryFeeStatus.FEE_SET_BY_STAFF ||
        effective === DeliveryFeeStatus.NOT_REQUIRED
        ? order.deliveryFee?.toString() ?? '0.00'
        : null,
      order.currency,
      this.customerMessage(effective),
    );
  }

  effectiveStatus(order: {
    deliveryFeeStatus: DeliveryFeeStatus;
    deliveryQuoteExpiresAt: Date | null;
  }): DeliveryFeeStatus {
    if (
      order.deliveryFeeStatus === DeliveryFeeStatus.QUOTE_AVAILABLE &&
      order.deliveryQuoteExpiresAt &&
      order.deliveryQuoteExpiresAt.getTime() <= Date.now()
    ) {
      return DeliveryFeeStatus.EXPIRED;
    }
    return order.deliveryFeeStatus;
  }

  async confirmQuote(
    actorUserId: string,
    orderId: string,
    dto: ConfirmDeliveryDto,
    ip?: string,
  ) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: orderInclude,
    });
    if (!order) throw new NotFoundException('Order not found.');
    if (order.fulfillmentMethod !== FulfillmentMethod.DELIVERY) {
      throw new BadRequestException('Order is not a delivery order.');
    }
    if (order.deliveryFeeStatus !== DeliveryFeeStatus.QUOTE_AVAILABLE) {
      throw new BadRequestException('No auto-quote available to confirm.');
    }
    if (
      order.deliveryQuoteExpiresAt &&
      order.deliveryQuoteExpiresAt.getTime() <= Date.now()
    ) {
      throw new BadRequestException('Delivery quote has expired.');
    }
    if (order.deliveryFee == null) {
      throw new BadRequestException('Delivery fee missing on quote.');
    }

    const updated = await this.applyConfirmedFee(
      order,
      order.deliveryFee,
      DeliveryFeeStatus.QUOTE_AVAILABLE,
      actorUserId,
      'delivery.confirm',
      dto.reason,
      ip,
    );
    return toPublicOrder(updated);
  }

  async overrideFee(
    actorUserId: string,
    orderId: string,
    dto: OverrideDeliveryDto,
    ip?: string,
  ) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: orderInclude,
    });
    if (!order) throw new NotFoundException('Order not found.');
    if (order.fulfillmentMethod !== FulfillmentMethod.DELIVERY) {
      throw new BadRequestException('Order is not a delivery order.');
    }
    if (order.status === OrderStatus.PAID) {
      throw new BadRequestException('Cannot change delivery on a paid order.');
    }

    let feeMinor: bigint;
    try {
      feeMinor = toMinorUnits(dto.deliveryFee);
    } catch {
      throw new BadRequestException('Invalid delivery fee.');
    }
    if (feeMinor < 0n) {
      throw new BadRequestException('Delivery fee cannot be negative.');
    }

    const fee = new Prisma.Decimal(fromMinorUnits(feeMinor));
    const updated = await this.applyConfirmedFee(
      order,
      fee,
      DeliveryFeeStatus.FEE_SET_BY_STAFF,
      actorUserId,
      'delivery.override',
      dto.reason,
      ip,
    );
    return toPublicOrder(updated);
  }

  private async applyConfirmedFee(
    order: Prisma.OrderGetPayload<{ include: typeof orderInclude }>,
    fee: Prisma.Decimal,
    status: DeliveryFeeStatus,
    actorUserId: string,
    action: string,
    reason?: string,
    ip?: string,
  ) {
    const subtotalMinor = toMinorUnits(order.subtotal.toString());
    const feeMinor = toMinorUnits(fee.toString());
    const total = fromMinorUnits(addMinor(subtotalMinor, feeMinor));

    const updated = await this.prisma.$transaction(async (tx) => {
      // Invalidate stale payment attempts against old totals
      await tx.payment.updateMany({
        where: {
          orderId: order.id,
          status: {
            in: [PaymentStatus.PENDING, PaymentStatus.PROCESSING],
          },
        },
        data: { status: PaymentStatus.CANCELLED },
      });

      const paymentMethod = order.payments[0]?.method;
      const nextStatus =
        paymentMethod === 'OFFLINE_CASH'
          ? OrderStatus.AWAITING_OFFLINE_PAYMENT
          : OrderStatus.PENDING_PAYMENT;

      await tx.order.update({
        where: { id: order.id },
        data: {
          deliveryFee: fee,
          deliveryFeeStatus: status,
          deliveryQuoteExpiresAt: null,
          total,
          status: nextStatus,
        },
      });

      // Create a fresh pending payment aligned to new total
      await tx.payment.create({
        data: {
          orderId: order.id,
          method: order.payments[0]?.method ?? 'PAYSTACK',
          provider: order.payments[0]?.provider ?? 'paystack',
          amount: total,
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
      actorUserId,
      action,
      entityType: 'Order',
      entityId: order.id,
      ip,
      metadata: {
        previousFee: order.deliveryFee?.toString() ?? null,
        previousStatus: order.deliveryFeeStatus,
        newFee: fee.toString(),
        newStatus: status,
        newTotal: total,
        reason: reason ?? null,
      },
    });

    return updated;
  }

  /** Staff-only internal view — least privilege applied by controller roles. */
  async getStaffDelivery(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });
    if (!order) throw new NotFoundException('Order not found.');
    let internal: unknown = null;
    if (order.deliveryInternalJson) {
      try {
        internal = JSON.parse(order.deliveryInternalJson);
      } catch {
        internal = null;
      }
    }
    return {
      orderId: order.id,
      orderNumber: order.orderNumber,
      deliveryFeeStatus: this.effectiveStatus(order),
      deliveryFee: order.deliveryFee?.toString() ?? null,
      currency: order.currency,
      expiresAt: order.deliveryQuoteExpiresAt?.toISOString() ?? null,
      internal,
    };
  }

  assertNotCustomerEscalation(_userId: string) {
    // Placeholder for clarity — RBAC guards enforce role.
    throw new ForbiddenException('Insufficient permissions.');
  }
}
