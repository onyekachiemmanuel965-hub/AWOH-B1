import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { DeliveryFeeStatus, FulfillmentMethod, OrderStatus } from '@prisma/client';
import { DeliveryService } from './delivery.service';
import { toCustomerDeliveryDto } from './delivery.calculator';

describe('DeliveryService privacy + gates', () => {
  it('customer DTO omits internal calculation fields', () => {
    const dto = toCustomerDeliveryDto(
      'QUOTE_AVAILABLE',
      '5000.00',
      'NGN',
      'Delivery fee confirmed.',
    );
    const raw = JSON.stringify(dto);
    expect(raw).not.toContain('weightPerCartonKg');
    expect(raw).not.toContain('totalWeight');
    expect(raw).not.toContain('distanceKm');
    expect(raw).not.toContain('ratePerKm');
    expect(raw).not.toContain('weightBracket');
    expect(raw).not.toContain('surcharge');
    expect(dto).toEqual({
      status: 'QUOTE_AVAILABLE',
      deliveryFee: '5000.00',
      currency: 'NGN',
      message: 'Delivery fee confirmed.',
    });
  });

  it('getCustomerDelivery hides fee during negotiation', async () => {
    const prisma = {
      order: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'o1',
          userId: 'u1',
          deliveryFeeStatus: DeliveryFeeStatus.NEEDS_NEGOTIATION,
          deliveryFee: { toString: () => '99999.00' },
          deliveryQuoteExpiresAt: null,
          currency: 'NGN',
        }),
      },
    };
    const service = new DeliveryService(
      prisma as never,
      { get: () => undefined } as never,
      { log: jest.fn() } as never,
      { resolveDistance: jest.fn() } as never,
    );
    const dto = await service.getCustomerDelivery('u1', 'o1');
    expect(dto.deliveryFee).toBeNull();
    expect(dto.message).toMatch(/contact AWOH-B/i);
    expect(JSON.stringify(dto)).not.toContain('99999');
  });

  it('getCustomerDelivery enforces ownership', async () => {
    const prisma = {
      order: { findFirst: jest.fn().mockResolvedValue(null) },
    };
    const service = new DeliveryService(
      prisma as never,
      { get: () => undefined } as never,
      { log: jest.fn() } as never,
      { resolveDistance: jest.fn() } as never,
    );
    await expect(service.getCustomerDelivery('u1', 'o1')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('overrideFee audits and recalculates total', async () => {
    const order = {
      id: 'o1',
      orderNumber: 'AWOH-1',
      userId: 'u1',
      status: OrderStatus.AWAITING_DELIVERY_CONFIRMATION,
      fulfillmentMethod: FulfillmentMethod.DELIVERY,
      deliveryFeeStatus: DeliveryFeeStatus.NEEDS_NEGOTIATION,
      deliveryFee: null,
      deliveryQuoteExpiresAt: null,
      deliveryInternalJson: null,
      subtotal: { toString: () => '10000.00' },
      total: { toString: () => '10000.00' },
      currency: 'NGN',
      contactEmail: 'a@b.com',
      contactPhone: null,
      shippingLine1: 'x',
      shippingCity: 'Lagos',
      shippingState: 'LA',
      shippingNotes: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      items: [],
      payments: [
        {
          id: 'pay1',
          method: 'PAYSTACK',
          provider: 'mock',
          status: 'PENDING',
          amount: { toString: () => '10000.00' },
          currency: 'NGN',
          providerReference: null,
          paidAt: null,
          createdAt: new Date(),
        },
      ],
      receipt: null,
    };

    const paymentUpdateMany = jest.fn();
    const paymentCreate = jest.fn();
    const orderUpdate = jest.fn();
    const auditLog = jest.fn().mockResolvedValue(undefined);

    const prisma = {
      order: {
        findUnique: jest.fn().mockResolvedValue(order),
      },
      $transaction: jest.fn(async (fn: (tx: unknown) => Promise<unknown>) => {
        const tx = {
          payment: {
            updateMany: paymentUpdateMany,
            create: paymentCreate,
          },
          order: {
            update: orderUpdate,
            findUniqueOrThrow: jest.fn().mockResolvedValue({
              ...order,
              deliveryFeeStatus: DeliveryFeeStatus.FEE_SET_BY_STAFF,
              deliveryFee: { toString: () => '7500.00' },
              total: { toString: () => '17500.00' },
              status: OrderStatus.PENDING_PAYMENT,
              payments: [
                {
                  id: 'pay2',
                  method: 'PAYSTACK',
                  status: 'PENDING',
                  amount: { toString: () => '17500.00' },
                  currency: 'NGN',
                  providerReference: null,
                  paidAt: null,
                  createdAt: new Date(),
                },
              ],
            }),
          },
        };
        return fn(tx);
      }),
    };

    const service = new DeliveryService(
      prisma as never,
      { get: () => 'NGN' } as never,
      { log: auditLog } as never,
      { resolveDistance: jest.fn() } as never,
    );

    const result = await service.overrideFee(
      'staff-1',
      'o1',
      { deliveryFee: '7500.00', reason: 'Negotiated with customer' },
      '127.0.0.1',
    );

    expect(paymentUpdateMany).toHaveBeenCalled();
    expect(orderUpdate).toHaveBeenCalled();
    expect(paymentCreate).toHaveBeenCalled();
    expect(auditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'delivery.override',
        entityId: 'o1',
        actorUserId: 'staff-1',
      }),
    );
    expect(result.deliveryFeeStatus).toBe(DeliveryFeeStatus.FEE_SET_BY_STAFF);
    expect(result.paymentAllowed).toBe(true);
    expect(result.total).toBe('17500.00');
    expect(JSON.stringify(result)).not.toContain('totalWeight');
  });

  it('assertNotCustomerEscalation always denies', () => {
    const service = new DeliveryService(
      {} as never,
      { get: () => undefined } as never,
      { log: jest.fn() } as never,
      { resolveDistance: jest.fn() } as never,
    );
    expect(() => service.assertNotCustomerEscalation('u1')).toThrow(
      ForbiddenException,
    );
  });
});
