export type DistanceRequest = {
  shippingLine1?: string | null;
  shippingCity?: string | null;
  shippingState?: string | null;
};

export type DistanceResult = {
  distanceKm: number | null;
  provider: string;
  available: boolean;
};

export interface DistanceProvider {
  readonly name: string;
  resolveDistance(input: DistanceRequest): Promise<DistanceResult>;
}

export const DISTANCE_PROVIDER = Symbol('DISTANCE_PROVIDER');
