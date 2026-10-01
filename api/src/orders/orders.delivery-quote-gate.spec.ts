import {
  DeliveryFeeStatus,
  FulfillmentMethod,
  OrderStatus,
} from '@prisma/client';
import {
  isCustomerQuoteConfirmed,
  isPaymentAllowed,
  toCustomerDeliveryQuoteState,
  toPublicOrder,
} from './orders.mapper';

describe('Stage 09 customer delivery quote payment gate', () => {
  const address = {
    shippingLine1: '12 Zik Avenue',
    shippingCity: 'Awka',
    shippingLga: 'Awka South',
    shippingState: 'Anambra',
  };
  const base = {
    deliveryFeeStatus: DeliveryFeeStatus.FEE_SET_BY_STAFF,
    deliveryFee: { toString: () => '5000.00' },
    deliveryQuoteExpiresAt: null as Date | null,
    deliveryQuoteVersion: 1,
    deliveryQuoteConfirmedVersion: null as number | null,
    status: OrderStatus.PENDING_PAYMENT,
    fulfillmentMethod: FulfillmentMethod.DELIVERY,
    ...address,
  };

  it('blocks payment when delivery address is missing', () => {
    expect(
      isPaymentAllowed({
        ...base,
        shippingLine1: null,
        shippingCity: null,
        shippingLga: null,
        shippingState: null,
        deliveryQuoteConfirmedVersion: 1,
      }),
    ).toBe(false);
    expect(
      toCustomerDeliveryQuoteState({
        ...base,
        shippingLine1: null,
        shippingCity: null,
        shippingLga: null,
        shippingState: null,
        deliveryFeeStatus: DeliveryFeeStatus.NEEDS_NEGOTIATION,
        deliveryFee: null,
        deliveryQuoteVersion: 0,
      }),
    ).toBe('DELIVERY_QUOTE_REQUIRED');
  });

  it('maps address-present negotiation to PENDING (not payable)', () => {
    expect(
      isPaymentAllowed({
        ...base,
        deliveryFeeStatus: DeliveryFeeStatus.NEEDS_NEGOTIATION,
        deliveryFee: null,
        deliveryQuoteVersion: 0,
      }),
    ).toBe(false);
    expect(
      toCustomerDeliveryQuoteState({
        ...base,
        deliveryFeeStatus: DeliveryFeeStatus.NEEDS_NEGOTIATION,
        deliveryFee: null,
        deliveryQuoteVersion: 0,
      }),
    ).toBe('DELIVERY_QUOTE_PENDING');
  });

  it('blocks payment when staff fee exists but customer has not confirmed', () => {
    expect(isPaymentAllowed(base)).toBe(false);
    expect(toCustomerDeliveryQuoteState(base)).toBe('DELIVERY_QUOTE_AVAILABLE');
    expect(isCustomerQuoteConfirmed(base)).toBe(false);
  });

  it('allows payment only after customer confirms current quote version', () => {
    const confirmed = {
      ...base,
      deliveryQuoteConfirmedVersion: 1,
    };
    expect(isPaymentAllowed(confirmed)).toBe(true);
    expect(toCustomerDeliveryQuoteState(confirmed)).toBe(
      'DELIVERY_QUOTE_CONFIRMED',
    );
  });

  it('invalidates confirmation when staff bumps quote version', () => {
    const stale = {
      ...base,
      deliveryQuoteVersion: 2,
      deliveryQuoteConfirmedVersion: 1,
      deliveryFee: { toString: () => '6500.00' },
    };
    expect(isPaymentAllowed(stale)).toBe(false);
    expect(toCustomerDeliveryQuoteState(stale)).toBe('DELIVERY_QUOTE_UPDATED');
  });

  it('blocks payment when quote is expired', () => {
    expect(
      isPaymentAllowed({
        ...base,
        deliveryFeeStatus: DeliveryFeeStatus.QUOTE_AVAILABLE,
        deliveryQuoteExpiresAt: new Date(Date.now() - 60_000),
        deliveryQuoteConfirmedVersion: 1,
      }),
    ).toBe(false);
    expect(
      toCustomerDeliveryQuoteState({
        ...base,
        deliveryFeeStatus: DeliveryFeeStatus.QUOTE_AVAILABLE,
        deliveryQuoteExpiresAt: new Date(Date.now() - 60_000),
        deliveryQuoteConfirmedVersion: 1,
      }),
    ).toBe('DELIVERY_QUOTE_EXPIRED');
  });

  it('pickup orders remain payable without delivery quote', () => {
    expect(
      isPaymentAllowed({
        deliveryFeeStatus: DeliveryFeeStatus.NOT_REQUIRED,
        deliveryFee: null,
        status: OrderStatus.PENDING_PAYMENT,
      }),
    ).toBe(true);
  });

  it('public DTO exposes quote status and never leaks internals', () => {
    const dto = toPublicOrder({
      id: 'o1',
      orderNumber: 'AWOH-1',
      userId: 'u1',
      status: OrderStatus.PENDING_PAYMENT,
      fulfillmentMethod: FulfillmentMethod.DELIVERY,
      deliveryFeeStatus: DeliveryFeeStatus.FEE_SET_BY_STAFF,
      deliveryFee: { toString: () => '5000.00' },
      deliveryQuoteExpiresAt: null,
      deliveryQuoteVersion: 1,
      deliveryQuoteConfirmedVersion: null,
      deliveryQuoteConfirmedAt: null,
      deliveryInternalJson: JSON.stringify({
        totalWeightKg: 99,
        distanceKm: 12,
        ratePerKm: 500,
      }),
      subtotal: { toString: () => '10000.00' },
      total: { toString: () => '15000.00' },
      currency: 'NGN',
      contactEmail: 'a@b.com',
      contactPhone: null,
      shippingLine1: '12 Admiralty Way',
      shippingCity: 'Lekki',
      shippingLga: 'Eti-Osa',
      shippingState: 'Lagos',
      shippingNotes: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      items: [],
      payments: [],
      receipt: null,
    } as never);

    expect(dto.deliveryQuoteStatus).toBe('DELIVERY_QUOTE_AVAILABLE');
    expect(dto.deliveryQuoteConfirmed).toBe(false);
    expect(dto.paymentAllowed).toBe(false);
    expect(dto.deliveryFee).toBe('5000.00');
    expect(dto.total).toBe('15000.00');
    const raw = JSON.stringify(dto);
    expect(raw).not.toContain('totalWeightKg');
    expect(raw).not.toContain('distanceKm');
    expect(raw).not.toContain('ratePerKm');
    expect(raw).not.toContain('deliveryInternalJson');
    expect(raw).not.toContain('deliveryQuoteVersion');
  });
});
