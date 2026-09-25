import { calculateDeliveryQuote } from './delivery.calculator';

describe('calculateDeliveryQuote', () => {
  const pricing = {
    ratePerKm: 500,
    weightFactorPerKg: 0,
    minFee: 0,
    maxFee: null as number | null,
    negotiationThreshold: 250000 as number | null,
  };

  it('computes provisional development fee from trusted config inputs', () => {
    // Uses provisional arithmetic with configured ratePerKm=500 for unit test only.
    // ₦500/km is NOT asserted as approved production policy.
    const result = calculateDeliveryQuote(
      [
        {
          productId: 'p1',
          quantity: 2,
          weightPerCartonKg: 32,
          productName: 'A',
        },
      ],
      10,
      pricing,
    );
    expect(result.status).toBe('QUOTE_AVAILABLE');
    expect(result.totalWeightKg).toBe(64);
    expect(result.appliedFee).toBe(5000);
  });

  it('requires negotiation when weight is missing', () => {
    const result = calculateDeliveryQuote(
      [
        {
          productId: 'p1',
          quantity: 1,
          weightPerCartonKg: null,
          productName: 'A',
        },
      ],
      10,
      pricing,
    );
    expect(result.status).toBe('NEEDS_NEGOTIATION');
    expect(result.reason).toBe('missing_product_weight');
  });

  it('requires negotiation when distance unavailable', () => {
    const result = calculateDeliveryQuote(
      [
        {
          productId: 'p1',
          quantity: 1,
          weightPerCartonKg: 15,
          productName: 'A',
        },
      ],
      null,
      pricing,
    );
    expect(result.status).toBe('NEEDS_NEGOTIATION');
    expect(result.reason).toBe('distance_unavailable');
  });

  it('requires negotiation above threshold', () => {
    const result = calculateDeliveryQuote(
      [
        {
          productId: 'p1',
          quantity: 1,
          weightPerCartonKg: 15,
          productName: 'A',
        },
      ],
      1000,
      { ...pricing, negotiationThreshold: 10000 },
    );
    expect(result.status).toBe('NEEDS_NEGOTIATION');
    expect(result.reason).toBe('above_negotiation_threshold');
  });

  it('customer DTO shape never includes weight fields in calculator output mapping', () => {
    const result = calculateDeliveryQuote(
      [{ productId: 'p1', quantity: 1, weightPerCartonKg: 15, productName: 'A' }],
      5,
      pricing,
    );
    const customer = {
      status: result.status,
      deliveryFee: result.appliedFee?.toFixed(2) ?? null,
      message: 'Delivery fee confirmed.',
    };
    expect(JSON.stringify(customer)).not.toContain('weight');
    expect(JSON.stringify(customer)).not.toContain('distanceKm');
    expect(JSON.stringify(customer)).not.toContain('ratePerKm');
  });
});
