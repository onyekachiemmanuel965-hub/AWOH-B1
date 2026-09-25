import { EXPLICIT_TILE_CARTON_WEIGHTS_KG } from '../../prisma/seed-weights';
import { calculateDeliveryQuote } from '../delivery/delivery.calculator';

describe('explicit seeded tile carton weights', () => {
  it('stores the approved size→weight table as explicit numeric strings', () => {
    expect(EXPLICIT_TILE_CARTON_WEIGHTS_KG['250x400']).toBe('15');
    expect(EXPLICIT_TILE_CARTON_WEIGHTS_KG['300x600']).toBe('25');
    expect(EXPLICIT_TILE_CARTON_WEIGHTS_KG['600x600']).toBe('32');
    expect(EXPLICIT_TILE_CARTON_WEIGHTS_KG['250x500']).toBe('28');
    expect(EXPLICIT_TILE_CARTON_WEIGHTS_KG['1200x600']).toBe('33');
  });

  it('calculator multiplies authoritative DB weight × quantity (never product name)', () => {
    // If weight were inferred from the productName "600x600", this would be wrong
    // when the DB weight disagrees — we pass DB weight explicitly.
    const result = calculateDeliveryQuote(
      [
        {
          productId: 'p1',
          quantity: 3,
          weightPerCartonKg: 32, // from Product.weightPerCartonKg
          productName: 'Completely Unrelated Name Without Size',
        },
      ],
      10,
      {
        ratePerKm: 500,
        weightFactorPerKg: 0,
        minFee: 0,
        maxFee: null,
        negotiationThreshold: null,
      },
    );
    expect(result.totalWeightKg).toBe(96); // 32 × 3 from DB field only
    expect(result.status).toBe('QUOTE_AVAILABLE');
  });

  it('does not invent weight from product name when DB weight is null', () => {
    const result = calculateDeliveryQuote(
      [
        {
          productId: 'p1',
          quantity: 1,
          weightPerCartonKg: null,
          productName: '600x600 Porcelain Should Not Infer 32kg',
        },
      ],
      10,
      {
        ratePerKm: 500,
        weightFactorPerKg: 0,
        minFee: 0,
        maxFee: null,
        negotiationThreshold: null,
      },
    );
    expect(result.status).toBe('NEEDS_NEGOTIATION');
    expect(result.reason).toBe('missing_product_weight');
    expect(result.totalWeightKg).toBe(0);
  });
});
