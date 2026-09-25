export type DeliveryLineInput = {
  productId: string;
  quantity: number;
  weightPerCartonKg: number | null;
  productName: string;
};

export type DeliveryPricingInput = {
  ratePerKm: number;
  weightFactorPerKg: number;
  minFee: number;
  maxFee: number | null;
  negotiationThreshold: number | null;
};

export type InternalDeliveryCalculation = {
  totalWeightKg: number;
  distanceKm: number | null;
  distanceAvailable: boolean;
  ratePerKm: number;
  weightFactorPerKg: number;
  rawFee: number | null;
  appliedFee: number | null;
  status: 'QUOTE_AVAILABLE' | 'NEEDS_NEGOTIATION' | 'UNCONFIRMED';
  reason: string;
};

/**
 * Pure delivery calculator — PROVISIONAL development implementation.
 *
 * IMPORTANT BOUNDARY:
 * - Pricing inputs (ratePerKm, weightFactorPerKg, minFee, maxFee,
 *   negotiationThreshold) come from DeliveryConfig / server env.
 * - Those config knobs are NOT automatically "final AWOH-B production policy"
 *   unless explicitly approved elsewhere. ₦500/km is a configuration default
 *   for development only — not a confirmed production business rule.
 * - The arithmetic below is a PROVISIONAL development placeholder so the
 *   delivery/payment gate architecture can be exercised. It is NOT an
 *   approved final business formula. Do not invent additional brackets.
 *
 * Provisional computation (development only):
 *   rawFee = distanceKm * ratePerKm + totalWeightKg * weightFactorPerKg
 *   appliedFee = clamp(max(minFee, rawFee), maxFee?)
 *
 * Negotiation when:
 * - any line missing authoritative Product.weightPerCartonKg
 * - distance unavailable
 * - negotiationThreshold exceeded (when configured)
 * - fee cannot be computed
 *
 * Customer APIs must never receive this internal calculation object —
 * map through toCustomerDeliveryDto only.
 */
export function calculateDeliveryQuote(
  lines: DeliveryLineInput[],
  distanceKm: number | null,
  pricing: DeliveryPricingInput,
): InternalDeliveryCalculation {
  let totalWeightKg = 0;
  for (const line of lines) {
    if (line.weightPerCartonKg == null || Number.isNaN(line.weightPerCartonKg)) {
      return {
        totalWeightKg: 0,
        distanceKm,
        distanceAvailable: distanceKm != null,
        ratePerKm: pricing.ratePerKm,
        weightFactorPerKg: pricing.weightFactorPerKg,
        rawFee: null,
        appliedFee: null,
        status: 'NEEDS_NEGOTIATION',
        reason: 'missing_product_weight',
      };
    }
    totalWeightKg += line.weightPerCartonKg * line.quantity;
  }

  if (distanceKm == null || distanceKm < 0 || Number.isNaN(distanceKm)) {
    return {
      totalWeightKg,
      distanceKm: null,
      distanceAvailable: false,
      ratePerKm: pricing.ratePerKm,
      weightFactorPerKg: pricing.weightFactorPerKg,
      rawFee: null,
      appliedFee: null,
      status: 'NEEDS_NEGOTIATION',
      reason: 'distance_unavailable',
    };
  }

  const raw =
    distanceKm * pricing.ratePerKm +
    totalWeightKg * pricing.weightFactorPerKg;
  let applied = Math.max(pricing.minFee, raw);
  if (pricing.maxFee != null) {
    applied = Math.min(pricing.maxFee, applied);
  }
  // Round to 2 decimal places using integer minor units
  applied = Math.round(applied * 100) / 100;

  if (
    pricing.negotiationThreshold != null &&
    applied > pricing.negotiationThreshold
  ) {
    return {
      totalWeightKg,
      distanceKm,
      distanceAvailable: true,
      ratePerKm: pricing.ratePerKm,
      weightFactorPerKg: pricing.weightFactorPerKg,
      rawFee: raw,
      appliedFee: applied,
      status: 'NEEDS_NEGOTIATION',
      reason: 'above_negotiation_threshold',
    };
  }

  return {
    totalWeightKg,
    distanceKm,
    distanceAvailable: true,
    ratePerKm: pricing.ratePerKm,
    weightFactorPerKg: pricing.weightFactorPerKg,
    rawFee: raw,
    appliedFee: applied,
    status: 'QUOTE_AVAILABLE',
    reason: 'ok',
  };
}

export function toCustomerDeliveryDto(
  status: string,
  deliveryFee: string | null,
  currency: string,
  message: string,
) {
  return {
    status,
    deliveryFee,
    currency,
    message,
  };
}
