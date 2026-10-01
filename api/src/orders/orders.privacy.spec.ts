import {
  DeliveryFeeStatus,
  FulfillmentMethod,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
} from '@prisma/client';
import { toPublicOrder } from './orders.mapper';
import { toCustomerDeliveryDto } from '../delivery/delivery.calculator';

const FORBIDDEN = [
  'deliveryInternalJson',
  'weightPerCartonKg',
  'totalWeightKg',
  'distanceKm',
  'ratePerKm',
  'weightFactorPerKg',
  'surcharge',
  'minimumFee',
  'maximumFee',
  'minFee',
  'maxFee',
  'negotiationThreshold',
  'deliveryConfigId',
];

function assertNoInternalLeak(payload: unknown) {
  const raw = JSON.stringify(payload);
  for (const key of FORBIDDEN) {
    expect(raw).not.toContain(key);
  }
}

describe('customer order/delivery privacy (deliveryInternalJson)', () => {
  const baseOrder = {
    id: 'o1',
    orderNumber: 'AWOH-2026-000099',
    userId: 'u1',
    status: OrderStatus.AWAITING_DELIVERY_CONFIRMATION,
    fulfillmentMethod: FulfillmentMethod.DELIVERY,
    deliveryFeeStatus: DeliveryFeeStatus.NEEDS_NEGOTIATION,
    deliveryFee: null,
    deliveryQuoteExpiresAt: null,
    deliveryInternalJson: JSON.stringify({
      totalWeightKg: 147,
      distanceKm: 38,
      ratePerKm: 500,
      weightFactorPerKg: 0,
      weightPerCartonKg: 32,
      negotiationThreshold: 250000,
      surcharge: 99,
    }),
    deliveryConfigId: 'cfg-secret',
    subtotal: { toString: () => '10000.00' },
    total: { toString: () => '10000.00' },
    currency: 'NGN',
    contactEmail: 'a@example.com',
    contactPhone: null,
    shippingLine1: '1 Demo St',
    shippingCity: 'Lagos',
    shippingLga: 'Eti-Osa',
    shippingState: 'Lagos',
    shippingNotes: null,
    idempotencyKey: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    items: [
      {
        id: 'i1',
        orderId: 'o1',
        productId: 'p1',
        productName: 'Demo',
        productSlug: 'demo',
        quantity: 2,
        unitPrice: { toString: () => '5000.00' },
        lineTotal: { toString: () => '10000.00' },
      },
    ],
    payments: [
      {
        id: 'pay1',
        orderId: 'o1',
        method: PaymentMethod.PAYSTACK,
        provider: 'mock',
        providerReference: null,
        amount: { toString: () => '10000.00' },
        currency: 'NGN',
        status: PaymentStatus.PENDING,
        accessCode: null,
        authorizationUrl: null,
        paidAt: null,
        metadataJson: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
    receipt: null,
  };

  it('toPublicOrder never includes deliveryInternalJson or calculation fields', () => {
    const dto = toPublicOrder(baseOrder as never);
    expect(dto).not.toHaveProperty('deliveryInternalJson');
    expect(dto).not.toHaveProperty('deliveryConfigId');
    assertNoInternalLeak(dto);
    expect(dto.deliveryFee).toBeNull();
    expect(dto.deliveryMessage).toMatch(/sales staff/i);
    expect(dto.paymentAllowed).toBe(false);
  });

  it('customer delivery DTO never includes internal calculation fields', () => {
    const dto = toCustomerDeliveryDto(
      DeliveryFeeStatus.NEEDS_NEGOTIATION,
      null,
      'NGN',
      'Please contact the sales team for a delivery quote before you can pay online.',
    );
    assertNoInternalLeak(dto);
    expect(Object.keys(dto).sort()).toEqual([
      'currency',
      'deliveryFee',
      'message',
      'status',
    ]);
  });

  it('confirmed public order still omits internal snapshot', () => {
    const dto = toPublicOrder({
      ...baseOrder,
      status: OrderStatus.PENDING_PAYMENT,
      deliveryFeeStatus: DeliveryFeeStatus.FEE_SET_BY_STAFF,
      deliveryFee: { toString: () => '7500.00' },
      total: { toString: () => '17500.00' },
      deliveryQuoteVersion: 1,
      deliveryQuoteConfirmedVersion: 1,
    } as never);
    expect(dto.deliveryFee).toBe('7500.00');
    expect(dto.paymentAllowed).toBe(true);
    expect(dto.deliveryQuoteStatus).toBe('DELIVERY_QUOTE_CONFIRMED');
    assertNoInternalLeak(dto);
  });

  it('staff fee without customer confirmation keeps paymentAllowed false', () => {
    const dto = toPublicOrder({
      ...baseOrder,
      status: OrderStatus.PENDING_PAYMENT,
      deliveryFeeStatus: DeliveryFeeStatus.FEE_SET_BY_STAFF,
      deliveryFee: { toString: () => '7500.00' },
      total: { toString: () => '17500.00' },
      deliveryQuoteVersion: 1,
      deliveryQuoteConfirmedVersion: null,
    } as never);
    expect(dto.paymentAllowed).toBe(false);
    expect(dto.deliveryQuoteStatus).toBe('DELIVERY_QUOTE_AVAILABLE');
  });
});
