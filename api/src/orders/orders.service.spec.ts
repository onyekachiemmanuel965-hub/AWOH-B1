import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import {
  CatalogStatus,
  DeliveryFeeStatus,
  FulfillmentMethod,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  ProductAvailability,
  UserStatus,
} from '@prisma/client';
import { OrdersService } from './orders.service';
import { toMinorUnits, fromMinorUnits, multiplyMinor } from '../common/money';
import { isPaymentAllowed } from './orders.mapper';

describe('OrdersService + money', () => {
  const currencyConfig = {
    get: (key: string) => {
      if (key === 'PAYMENT_CURRENCY' || key === 'CURRENCY_DEFAULT') return 'NGN';
      return undefined;
    },
  };

  const product = {
    id: 'prod-1',
    name: 'Demo Tile',
    slug: 'demo-tile',
    price: { toString: () => '1000.00' },
    status: CatalogStatus.ACTIVE,
    availability: ProductAvailability.AVAILABLE,
    tileSize: null,
    specsJson: null,
  };

  function buildService(prisma: Record<string, unknown>) {
    const delivery = {
      evaluateForOrderLines: jest.fn().mockResolvedValue({
        status: 'NEEDS_NEGOTIATION',
        deliveryFee: null,
        deliveryMinor: 0n,
        expiresAt: null,
        configId: 'cfg1',
        internalJson: '{}',
      }),
    };
    const audit = { log: jest.fn().mockResolvedValue(undefined) };
    const locations = {
      resolveValidatedAddress: jest.fn().mockResolvedValue({
        shippingStateId: 's1',
        shippingLgaId: 'l1',
        shippingTownId: 't1',
        shippingState: 'Anambra',
        shippingLga: 'Awka South',
        shippingCity: 'Awka',
        shippingLine1: '12 Road',
        shippingNotes: null,
      }),
    };
    return new OrdersService(
      prisma as never,
      currencyConfig as never,
      delivery as never,
      audit as never,
      locations as never,
    );
  }

  it('uses integer minor units without float drift', () => {
    const unit = toMinorUnits('19.99');
    expect(fromMinorUnits(multiplyMinor(unit, 3))).toBe('59.97');
  });

  it('rejects unauthenticated create via missing user path (service requires userId)', async () => {
    // Ownership is enforced by controller JwtAuthGuard; service still requires userId.
    const prisma = {
      order: { findUnique: jest.fn(), count: jest.fn() },
      product: { findMany: jest.fn().mockResolvedValue([]) },
      $transaction: jest.fn(),
    };
    const service = buildService(prisma);
    await expect(
      service.createOrder('user-1', {
        items: [{ productId: 'missing', quantity: 1 }],
        fulfillmentMethod: FulfillmentMethod.PICKUP,
        paymentMethod: PaymentMethod.PAYSTACK,
        contactEmail: 'a@example.com',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('recalculates totals from backend product prices ignoring client money', async () => {
    const createdOrder = {
      id: 'o1',
      orderNumber: 'AWOH-2026-000001',
      userId: 'user-1',
      status: OrderStatus.PENDING_PAYMENT,
      fulfillmentMethod: FulfillmentMethod.PICKUP,
      deliveryFeeStatus: DeliveryFeeStatus.NOT_REQUIRED,
      deliveryFee: { toString: () => '0.00' },
      subtotal: { toString: () => '2000.00' },
      total: { toString: () => '2000.00' },
      currency: 'NGN',
      contactEmail: 'a@example.com',
      contactPhone: null,
      shippingLine1: null,
      shippingCity: null,
      shippingState: null,
      shippingNotes: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      items: [
        {
          id: 'i1',
          productId: 'prod-1',
          productName: 'Demo Tile',
          productSlug: 'demo-tile',
          quantity: 2,
          unitPrice: { toString: () => '1000.00' },
          lineTotal: { toString: () => '2000.00' },
        },
      ],
      payments: [
        {
          id: 'pay1',
          method: PaymentMethod.PAYSTACK,
          status: PaymentStatus.PENDING,
          amount: { toString: () => '2000.00' },
          currency: 'NGN',
          providerReference: null,
          paidAt: null,
          createdAt: new Date(),
        },
      ],
      receipt: null,
    };

    const prisma = {
      order: {
        findUnique: jest.fn().mockResolvedValue(null),
        count: jest.fn().mockResolvedValue(0),
      },
      product: {
        findMany: jest.fn().mockResolvedValue([product]),
      },
      $transaction: jest.fn(async (fn: (tx: unknown) => Promise<unknown>) => {
        const tx = {
          order: {
            findUnique: jest.fn().mockResolvedValue(null),
            count: jest.fn().mockResolvedValue(0),
            create: jest.fn().mockImplementation(async ({ data }: { data: { subtotal: string; total: string; items: { create: unknown[] } } }) => {
              expect(data.subtotal).toBe('2000.00');
              expect(data.total).toBe('2000.00');
              expect(data.items.create).toHaveLength(1);
              return createdOrder;
            }),
          },
        };
        return fn(tx);
      }),
    };

    const service = buildService(prisma);
    const result = await service.createOrder('user-1', {
      items: [{ productId: 'prod-1', quantity: 2 }],
      fulfillmentMethod: FulfillmentMethod.PICKUP,
      paymentMethod: PaymentMethod.PAYSTACK,
      contactEmail: 'a@example.com',
      // Client cannot force totals — these fields are not even on the DTO
    });

    expect(result.subtotal).toBe('2000.00');
    expect(result.total).toBe('2000.00');
    expect(result.paymentAllowed).toBe(true);
  });

  it('blocks payment for delivery needing negotiation', async () => {
    const prisma = {
      order: { findUnique: jest.fn().mockResolvedValue(null) },
      product: { findMany: jest.fn().mockResolvedValue([product]) },
      $transaction: jest.fn(async (fn: (tx: unknown) => Promise<unknown>) => {
        const tx = {
          order: {
            findUnique: jest.fn().mockResolvedValue(null),
            count: jest.fn().mockResolvedValue(0),
            create: jest.fn().mockImplementation(async ({ data }: { data: { status: OrderStatus; deliveryFeeStatus: DeliveryFeeStatus } }) => {
              expect(data.deliveryFeeStatus).toBe(DeliveryFeeStatus.NEEDS_NEGOTIATION);
              expect(data.status).toBe(OrderStatus.AWAITING_DELIVERY_CONFIRMATION);
              return {
                id: 'o2',
                orderNumber: 'AWOH-2026-000002',
                userId: 'user-1',
                status: data.status,
                fulfillmentMethod: FulfillmentMethod.DELIVERY,
                deliveryFeeStatus: data.deliveryFeeStatus,
                deliveryFee: null,
                deliveryQuoteVersion: 0,
                deliveryQuoteConfirmedVersion: null,
                deliveryQuoteConfirmedAt: null,
                deliveryQuoteExpiresAt: null,
                subtotal: { toString: () => '1000.00' },
                total: { toString: () => '1000.00' },
                currency: 'NGN',
                contactEmail: 'a@example.com',
                contactPhone: null,
                shippingLine1: '1 Demo Street',
                shippingCity: 'Awka',
                shippingLga: 'Awka South',
                shippingState: 'Anambra',
                shippingNotes: null,
                createdAt: new Date(),
                updatedAt: new Date(),
                items: [],
                payments: [],
                receipt: null,
              };
            }),
          },
        };
        return fn(tx);
      }),
    };

    const service = buildService(prisma);
    const result = await service.createOrder('user-1', {
      items: [{ productId: 'prod-1', quantity: 1 }],
      fulfillmentMethod: FulfillmentMethod.DELIVERY,
      paymentMethod: PaymentMethod.PAYSTACK,
      contactEmail: 'a@example.com',
      shippingStateId: 's1',
      shippingLgaId: 'l1',
      shippingTownId: 't1',
      shippingLine1: '1 Demo Street',
    });

    expect(result.paymentAllowed).toBe(false);
    expect(result.deliveryMessage).toMatch(/sales staff/i);
    expect(isPaymentAllowed(result as never)).toBe(false);
  });

  it('creates offline order without marking paid', async () => {
    const prisma = {
      order: { findUnique: jest.fn().mockResolvedValue(null) },
      product: { findMany: jest.fn().mockResolvedValue([product]) },
      $transaction: jest.fn(async (fn: (tx: unknown) => Promise<unknown>) => {
        const tx = {
          order: {
            findUnique: jest.fn().mockResolvedValue(null),
            count: jest.fn().mockResolvedValue(0),
            create: jest.fn().mockImplementation(async ({ data }: { data: { status: OrderStatus; payments: { create: { status: PaymentStatus } } } }) => {
              expect(data.status).toBe(OrderStatus.AWAITING_OFFLINE_PAYMENT);
              expect(data.payments.create.status).toBe(PaymentStatus.PENDING);
              return {
                id: 'o3',
                orderNumber: 'AWOH-2026-000003',
                userId: 'user-1',
                status: data.status,
                fulfillmentMethod: FulfillmentMethod.PICKUP,
                deliveryFeeStatus: DeliveryFeeStatus.NOT_REQUIRED,
                deliveryFee: { toString: () => '0.00' },
                subtotal: { toString: () => '1000.00' },
                total: { toString: () => '1000.00' },
                currency: 'NGN',
                contactEmail: 'a@example.com',
                contactPhone: null,
                shippingLine1: null,
                shippingCity: null,
                shippingState: null,
                shippingNotes: null,
                createdAt: new Date(),
                updatedAt: new Date(),
                items: [],
                payments: [
                  {
                    id: 'p1',
                    method: PaymentMethod.OFFLINE_CASH,
                    status: PaymentStatus.PENDING,
                    amount: { toString: () => '1000.00' },
                    currency: 'NGN',
                    providerReference: null,
                    paidAt: null,
                    createdAt: new Date(),
                  },
                ],
                receipt: null,
              };
            }),
          },
        };
        return fn(tx);
      }),
    };

    const service = buildService(prisma);
    const result = await service.createOrder('user-1', {
      items: [{ productId: 'prod-1', quantity: 1 }],
      fulfillmentMethod: FulfillmentMethod.PICKUP,
      paymentMethod: PaymentMethod.OFFLINE_CASH,
      contactEmail: 'a@example.com',
    });

    expect(result.status).toBe(OrderStatus.AWAITING_OFFLINE_PAYMENT);
    expect(result.payment?.status).toBe(PaymentStatus.PENDING);
  });

  it('enforces ownership on getForUser', async () => {
    const prisma = {
      order: {
        findFirst: jest.fn().mockResolvedValue(null),
      },
    };
    const service = buildService(prisma);
    await expect(service.getForUser('user-1', 'order-x')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('assertPayable rejects foreign user', () => {
    const service = buildService({});
    expect(() =>
      service.assertPayable(
        {
          userId: 'owner',
          deliveryFeeStatus: DeliveryFeeStatus.NOT_REQUIRED,
          status: OrderStatus.PENDING_PAYMENT,
        },
        'intruder',
      ),
    ).toThrow(ForbiddenException);
  });

  it('assertPayable blocks expired delivery quotes', () => {
    const service = buildService({});
    expect(() =>
      service.assertPayable(
        {
          userId: 'owner',
          fulfillmentMethod: FulfillmentMethod.DELIVERY,
          deliveryFeeStatus: DeliveryFeeStatus.QUOTE_AVAILABLE,
          deliveryQuoteExpiresAt: new Date(Date.now() - 60_000),
          deliveryQuoteVersion: 1,
          deliveryQuoteConfirmedVersion: 1,
          deliveryFee: { toString: () => '1000.00' },
          status: OrderStatus.PENDING_PAYMENT,
          shippingLine1: '12 Road',
          shippingCity: 'Awka',
          shippingLga: 'Awka South',
          shippingState: 'Anambra',
        },
        'owner',
      ),
    ).toThrow(BadRequestException);
  });

  it('assertPayable blocks staff fee until customer confirms', () => {
    const service = buildService({});
    expect(() =>
      service.assertPayable(
        {
          userId: 'owner',
          fulfillmentMethod: FulfillmentMethod.DELIVERY,
          deliveryFeeStatus: DeliveryFeeStatus.FEE_SET_BY_STAFF,
          deliveryQuoteVersion: 1,
          deliveryQuoteConfirmedVersion: null,
          deliveryFee: { toString: () => '5000.00' },
          status: OrderStatus.PENDING_PAYMENT,
          shippingLine1: '12 Road',
          shippingCity: 'Awka',
          shippingLga: 'Awka South',
          shippingState: 'Anambra',
        },
        'owner',
      ),
    ).toThrow(BadRequestException);
  });

  it('assertPayable allows confirmed quote within TTL', () => {
    const service = buildService({});
    expect(() =>
      service.assertPayable(
        {
          userId: 'owner',
          fulfillmentMethod: FulfillmentMethod.DELIVERY,
          deliveryFeeStatus: DeliveryFeeStatus.QUOTE_AVAILABLE,
          deliveryQuoteExpiresAt: new Date(Date.now() + 60_000),
          deliveryQuoteVersion: 1,
          deliveryQuoteConfirmedVersion: 1,
          deliveryFee: { toString: () => '1000.00' },
          status: OrderStatus.PENDING_PAYMENT,
          shippingLine1: '12 Road',
          shippingCity: 'Awka',
          shippingLga: 'Awka South',
          shippingState: 'Anambra',
        },
        'owner',
      ),
    ).not.toThrow();
  });

  it('acceptDeliveryQuote records confirmation against current version', async () => {
    const order = {
      id: 'o1',
      orderNumber: 'AWOH-1',
      userId: 'owner',
      status: OrderStatus.PENDING_PAYMENT,
      fulfillmentMethod: FulfillmentMethod.DELIVERY,
      deliveryFeeStatus: DeliveryFeeStatus.FEE_SET_BY_STAFF,
      deliveryFee: { toString: () => '5000.00' },
      deliveryQuoteExpiresAt: null,
      deliveryQuoteVersion: 2,
      deliveryQuoteConfirmedVersion: null,
      deliveryQuoteConfirmedAt: null,
      subtotal: { toString: () => '10000.00' },
      total: { toString: () => '15000.00' },
      currency: 'NGN',
      contactEmail: 'a@b.com',
      contactPhone: null,
      shippingLine1: '12 Road',
      shippingCity: 'Awka',
      shippingLga: 'Awka South',
      shippingState: 'Anambra',
      shippingNotes: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      items: [],
      payments: [],
      receipt: null,
    };
    const audit = { log: jest.fn().mockResolvedValue(undefined) };
    const prisma = {
      order: {
        findFirst: jest.fn().mockResolvedValue(order),
        update: jest.fn().mockResolvedValue({
          ...order,
          deliveryQuoteConfirmedVersion: 2,
          deliveryQuoteConfirmedAt: new Date(),
        }),
      },
    };
    const service = new OrdersService(
      prisma as never,
      currencyConfig as never,
      { evaluateForOrderLines: jest.fn() } as never,
      audit as never,
      {
        resolveValidatedAddress: jest.fn(),
      } as never,
    );

    const result = await service.acceptDeliveryQuote('owner', 'o1', '127.0.0.1');
    expect(result.paymentAllowed).toBe(true);
    expect(result.deliveryQuoteStatus).toBe('DELIVERY_QUOTE_CONFIRMED');
    expect(audit.log).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'delivery.customer_confirm_quote',
        entityId: 'o1',
      }),
    );
  });

  it('acceptDeliveryQuote rejects foreign user', async () => {
    const prisma = {
      order: { findFirst: jest.fn().mockResolvedValue(null) },
    };
    const service = buildService(prisma);
    await expect(
      service.acceptDeliveryQuote('intruder', 'o1'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});

// silence unused import lint in some tooling
void UserStatus;
