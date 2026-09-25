import { buildReceiptTextLines } from './receipt.service';
import {
  DeliveryFeeStatus,
  FulfillmentMethod,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
} from '@prisma/client';

describe('receipt privacy', () => {
  it('receipt text lines omit internal delivery calculation fields', () => {
    const order = {
      id: 'o1',
      orderNumber: 'AWOH-PRIVACY-001',
      userId: 'u1',
      status: OrderStatus.PAID,
      fulfillmentMethod: FulfillmentMethod.DELIVERY,
      deliveryFeeStatus: DeliveryFeeStatus.FEE_SET_BY_STAFF,
      deliveryFee: { toString: () => '7500.00' },
      deliveryQuoteExpiresAt: null,
      deliveryInternalJson: JSON.stringify({
        totalWeightKg: 147,
        distanceKm: 38,
        ratePerKm: 500,
        weightFactorPerKg: 2,
        negotiationThreshold: 1000,
        surcharge: 50,
        weightPerCartonKg: 32,
      }),
      deliveryConfigId: 'cfg1',
      subtotal: { toString: () => '10000.00' },
      total: { toString: () => '17500.00' },
      currency: 'NGN',
      contactEmail: 'a@example.com',
      contactPhone: null,
      shippingLine1: null,
      shippingCity: null,
      shippingState: null,
      shippingNotes: null,
      idempotencyKey: null,
      createdAt: new Date('2026-09-23T00:00:00.000Z'),
      updatedAt: new Date('2026-09-23T00:00:00.000Z'),
      items: [
        {
          id: 'i1',
          orderId: 'o1',
          productId: 'p1',
          productName: 'Demo Tile',
          productSlug: 'demo-tile',
          quantity: 1,
          unitPrice: { toString: () => '10000.00' },
          lineTotal: { toString: () => '10000.00' },
        },
      ],
      payments: [
        {
          id: 'pay1',
          orderId: 'o1',
          method: PaymentMethod.PAYSTACK,
          provider: 'mock',
          providerReference: 'ref_privacy',
          amount: { toString: () => '17500.00' },
          currency: 'NGN',
          status: PaymentStatus.SUCCESS,
          accessCode: null,
          authorizationUrl: null,
          paidAt: new Date(),
          metadataJson: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
    };

    const lines = buildReceiptTextLines(order as never);
    const joined = lines.join('\n');
    expect(joined).toContain('Delivery fee: 7500.00 NGN');
    expect(joined).toContain('Total: 17500.00 NGN');
    for (const leak of [
      'deliveryInternalJson',
      'weightPerCartonKg',
      'totalWeightKg',
      'distanceKm',
      'ratePerKm',
      'weightFactorPerKg',
      'negotiationThreshold',
      'surcharge',
      '147',
      '38km',
    ]) {
      expect(joined).not.toContain(leak);
    }
  });
});
