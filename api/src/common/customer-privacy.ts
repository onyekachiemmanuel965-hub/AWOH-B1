/**
 * Shared list of fields customers must never receive (Stages 04–08 contract).
 * Privacy regression tests MUST fail CI if any of these appear in public DTOs.
 */
export const CUSTOMER_FORBIDDEN_FIELDS = [
  'weightPerCartonKg',
  'totalWeightKg',
  'distanceKm',
  'ratePerKm',
  'weightFactorPerKg',
  'surcharge',
  'negotiationThreshold',
  'deliveryInternalJson',
  'stockQuantity',
  'deliveryConfigId',
  'minimumFee',
  'maximumFee',
  'minFee',
  'maxFee',
  'passwordHash',
  'refreshTokenHash',
] as const;

export function containsCustomerForbiddenField(payload: unknown): string | null {
  const raw = JSON.stringify(payload);
  for (const key of CUSTOMER_FORBIDDEN_FIELDS) {
    if (raw.includes(key)) return key;
  }
  return null;
}
