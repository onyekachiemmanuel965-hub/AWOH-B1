import { BadRequestException, NotFoundException } from '@nestjs/common';
import {
  FulfillmentMethod,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  DeliveryFeeStatus,
} from '@prisma/client';
import { PaymentsService } from '../payments/payments.service';

describe('confirmOfflinePayment', () => {
  function build(order: Record<string, unknown>) {
    const prisma = {
      order: {
        findUnique: jest.fn().mockResolvedValue(order),
        findUniqueOrThrow: jest.fn(),
        update: jest.fn(),
      },
      payment: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      receipt: { create: jest.fn() },
      $transaction: jest.fn(async (fn: (tx: unknown) => Promise<unknown>) => {
        const tx = {
          payment: {
            findUnique: jest.fn().mockResolvedValue(order.payments?.[0]),
            update: jest.fn(),
          },
          order: { update: jest.fn() },
        };
        return fn(tx);
      }),
    };
    const orders = {
      assertPayable: jest.fn(),
    };
    const audit = { log: jest.fn().mockResolvedValue(undefined) };
    const receipts = {
      generatePdf: jest.fn().mockResolvedValue('/tmp/r.pdf'),
      sendEmailReceipt: jest.fn().mockResolvedValue({ status: 'LOGGED' }),
    };
    const service = new PaymentsService(
      prisma as never,
      orders as never,
      { get: () => 'NGN' } as never,
      { name: 'mock' } as never,
      {} as never,
      receipts as never,
      audit as never,
      { attempt: () => true } as never,
    );
    return { service, prisma, orders, audit, receipts };
  }

  it('rejects when no offline payment exists', async () => {
    const { service } = build({
      id: 'o1',
      userId: 'u1',
      status: OrderStatus.PENDING_PAYMENT,
      fulfillmentMethod: FulfillmentMethod.PICKUP,
      deliveryFeeStatus: DeliveryFeeStatus.NOT_REQUIRED,
      deliveryQuoteExpiresAt: null,
      total: { toString: () => '1000.00' },
      currency: 'NGN',
      payments: [
        {
          id: 'p1',
          method: PaymentMethod.PAYSTACK,
          status: PaymentStatus.PENDING,
          amount: { toString: () => '1000.00' },
          createdAt: new Date(),
        },
      ],
      items: [],
      receipt: null,
    });
    await expect(
      service.confirmOfflinePayment('staff', 'o1'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('is idempotent when already paid', async () => {
    const order = {
      id: 'o1',
      userId: 'u1',
      orderNumber: 'AWOH-1',
      status: OrderStatus.PAID,
      fulfillmentMethod: FulfillmentMethod.PICKUP,
      deliveryFeeStatus: DeliveryFeeStatus.NOT_REQUIRED,
      deliveryFee: { toString: () => '0.00' },
      deliveryQuoteExpiresAt: null,
      subtotal: { toString: () => '1000.00' },
      total: { toString: () => '1000.00' },
      currency: 'NGN',
      contactEmail: 'a@b.com',
      contactPhone: null,
      shippingLine1: null,
      shippingCity: null,
      shippingState: null,
      shippingNotes: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      payments: [
        {
          id: 'p1',
          method: PaymentMethod.OFFLINE_CASH,
          status: PaymentStatus.SUCCESS,
          amount: { toString: () => '1000.00' },
          currency: 'NGN',
          providerReference: null,
          paidAt: new Date(),
          createdAt: new Date(),
        },
      ],
      items: [],
      receipt: { id: 'r1' },
    };
    const { service, audit } = build(order);
    const result = await service.confirmOfflinePayment('staff', 'o1');
    expect(result.alreadyProcessed).toBe(true);
    expect(audit.log).not.toHaveBeenCalled();
  });

  it('throws NotFound for missing order', async () => {
    const prisma = {
      order: { findUnique: jest.fn().mockResolvedValue(null) },
    };
    const service = new PaymentsService(
      prisma as never,
      { assertPayable: jest.fn() } as never,
      { get: () => undefined } as never,
      { name: 'mock' } as never,
      {} as never,
      {} as never,
      { log: jest.fn() } as never,
      { attempt: () => true } as never,
    );
    await expect(
      service.confirmOfflinePayment('staff', 'missing'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
