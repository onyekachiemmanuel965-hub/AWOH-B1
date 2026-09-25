import {
  DeliveryFeeStatus,
  FulfillmentMethod,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
} from '@prisma/client';
import { toStaffOrder } from './admin.mapper';

describe('admin staff order DTO privacy', () => {
  it('never includes deliveryInternalJson or calculation fields', () => {
    const dto = toStaffOrder({
      id: 'o1',
      orderNumber: 'AWOH-1',
      userId: 'u1',
      status: OrderStatus.AWAITING_DELIVERY_CONFIRMATION,
      fulfillmentMethod: FulfillmentMethod.DELIVERY,
      deliveryFeeStatus: DeliveryFeeStatus.NEEDS_NEGOTIATION,
      deliveryFee: null,
      deliveryQuoteExpiresAt: null,
      subtotal: { toString: () => '1000.00' },
      total: { toString: () => '1000.00' },
      currency: 'NGN',
      contactEmail: 'a@b.com',
      contactPhone: null,
      shippingLine1: 'x',
      shippingCity: 'Lagos',
      shippingState: 'LA',
      shippingNotes: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      user: {
        id: 'u1',
        email: 'a@b.com',
        firstName: 'A',
        lastName: 'B',
      },
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
    } as never);

    const raw = JSON.stringify(dto);
    expect(raw).not.toContain('deliveryInternalJson');
    expect(raw).not.toContain('weightPerCartonKg');
    expect(raw).not.toContain('totalWeightKg');
    expect(raw).not.toContain('distanceKm');
    expect(raw).not.toContain('ratePerKm');
    expect(dto.customer.email).toBe('a@b.com');
  });
});
