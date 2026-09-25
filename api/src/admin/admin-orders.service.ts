import { Injectable, NotFoundException } from '@nestjs/common';
import {
  DeliveryFeeStatus,
  OrderStatus,
  PaymentStatus,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AdminOrdersQueryDto } from './dto/admin.dto';
import { toStaffOrder } from './admin.mapper';

const orderInclude = {
  items: true,
  payments: true,
  receipt: true,
  user: {
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
    },
  },
} satisfies Prisma.OrderInclude;

@Injectable()
export class AdminOrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: AdminOrdersQueryDto) {
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 20, 100);
    const where: Prisma.OrderWhereInput = {};

    if (query.status) where.status = query.status;
    if (query.fulfillmentMethod) where.fulfillmentMethod = query.fulfillmentMethod;
    if (query.deliveryFeeStatus) where.deliveryFeeStatus = query.deliveryFeeStatus;
    if (query.paymentStatus) {
      where.payments = { some: { status: query.paymentStatus } };
    }
    if (query.q?.trim()) {
      const q = query.q.trim();
      where.OR = [
        { orderNumber: { contains: q } },
        { contactEmail: { contains: q } },
        { user: { email: { contains: q } } },
      ];
    }

    const [total, rows] = await this.prisma.$transaction([
      this.prisma.order.count({ where }),
      this.prisma.order.findMany({
        where,
        include: orderInclude,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return {
      data: rows.map(toStaffOrder),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  }

  async getById(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: orderInclude,
    });
    if (!order) throw new NotFoundException('Order not found.');
    return toStaffOrder(order);
  }

  async dashboardStats() {
    const [
      totalOrders,
      pendingPayment,
      awaitingOffline,
      awaitingDelivery,
      paid,
      paymentFailed,
      productCount,
      lowStock,
      outOfStock,
      recentOrders,
      recentAudit,
    ] = await this.prisma.$transaction([
      this.prisma.order.count(),
      this.prisma.order.count({ where: { status: OrderStatus.PENDING_PAYMENT } }),
      this.prisma.order.count({
        where: { status: OrderStatus.AWAITING_OFFLINE_PAYMENT },
      }),
      this.prisma.order.count({
        where: {
          OR: [
            { status: OrderStatus.AWAITING_DELIVERY_CONFIRMATION },
            { deliveryFeeStatus: DeliveryFeeStatus.NEEDS_NEGOTIATION },
          ],
        },
      }),
      this.prisma.order.count({ where: { status: OrderStatus.PAID } }),
      this.prisma.order.count({ where: { status: OrderStatus.PAYMENT_FAILED } }),
      this.prisma.product.count(),
      this.prisma.product.count({
        where: { stockQuantity: { gt: 0, lte: 5 } },
      }),
      this.prisma.product.count({ where: { stockQuantity: 0 } }),
      this.prisma.order.findMany({
        include: orderInclude,
        orderBy: { createdAt: 'desc' },
        take: 8,
      }),
      this.prisma.auditLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
    ]);

    return {
      totals: {
        orders: totalOrders,
        pendingPayment,
        awaitingOffline,
        awaitingDelivery,
        paid,
        paymentFailed,
        products: productCount,
        lowStock,
        outOfStock,
      },
      recentOrders: recentOrders.map(toStaffOrder),
      recentActivity: recentAudit.map((a) => ({
        id: a.id,
        action: a.action,
        entityType: a.entityType,
        entityId: a.entityId,
        actorUserId: a.actorUserId,
        createdAt: a.createdAt.toISOString(),
        metadata: safeAuditMetadata(a.metadataJson),
      })),
    };
  }
}

function safeAuditMetadata(raw: string | null) {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const blocked = [
      'password',
      'passwordHash',
      'token',
      'refreshToken',
      'secret',
      'apiKey',
      'webhook',
    ];
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(parsed)) {
      if (blocked.some((b) => k.toLowerCase().includes(b))) continue;
      out[k] = v;
    }
    return out;
  } catch {
    return null;
  }
}

export { PaymentStatus };
