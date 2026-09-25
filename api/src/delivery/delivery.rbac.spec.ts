import { DeliveryFeeStatus } from '@prisma/client';
import { DeliveryService } from './delivery.service';

describe('staff vs customer delivery visibility', () => {
  const internalPayload = {
    totalWeightKg: 64,
    distanceKm: 12,
    ratePerKm: 500,
    weightFactorPerKg: 0,
    negotiationThreshold: 250000,
  };

  it('staff internal view may include calculation snapshot', async () => {
    const prisma = {
      order: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'o1',
          orderNumber: 'AWOH-1',
          deliveryFeeStatus: DeliveryFeeStatus.NEEDS_NEGOTIATION,
          deliveryFee: null,
          deliveryQuoteExpiresAt: null,
          currency: 'NGN',
          deliveryInternalJson: JSON.stringify(internalPayload),
        }),
      },
    };
    const service = new DeliveryService(
      prisma as never,
      { get: () => undefined } as never,
      { log: jest.fn() } as never,
      { resolveDistance: jest.fn() } as never,
    );
    const staff = await service.getStaffDelivery('o1');
    expect(staff.internal).toEqual(internalPayload);
  });

  it('customer delivery view never includes calculation snapshot', async () => {
    const prisma = {
      order: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'o1',
          userId: 'u1',
          deliveryFeeStatus: DeliveryFeeStatus.NEEDS_NEGOTIATION,
          deliveryFee: { toString: () => '999.00' },
          deliveryQuoteExpiresAt: null,
          currency: 'NGN',
          deliveryInternalJson: JSON.stringify(internalPayload),
        }),
      },
    };
    const service = new DeliveryService(
      prisma as never,
      { get: () => undefined } as never,
      { log: jest.fn() } as never,
      { resolveDistance: jest.fn() } as never,
    );
    const customer = await service.getCustomerDelivery('u1', 'o1');
    const raw = JSON.stringify(customer);
    expect(raw).not.toContain('deliveryInternalJson');
    expect(raw).not.toContain('totalWeightKg');
    expect(raw).not.toContain('distanceKm');
    expect(raw).not.toContain('ratePerKm');
    expect(raw).not.toContain('weightFactorPerKg');
    expect(raw).not.toContain('negotiationThreshold');
    expect(customer.deliveryFee).toBeNull();
    expect(customer.message).toMatch(/contact AWOH-B/i);
  });
});
