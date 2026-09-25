import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  DistanceProvider,
  DistanceRequest,
  DistanceResult,
} from './distance-provider';

/**
 * Development distance provider.
 * Uses a deterministic pseudo-distance from city/state text when present.
 * Production should swap for a trusted maps/geocoding provider.
 */
@Injectable()
export class MockDistanceProvider implements DistanceProvider {
  readonly name = 'mock';

  constructor(private readonly config: ConfigService) {}

  async resolveDistance(input: DistanceRequest): Promise<DistanceResult> {
    const city = (input.shippingCity || '').trim().toLowerCase();
    const state = (input.shippingState || '').trim().toLowerCase();
    const line = (input.shippingLine1 || '').trim().toLowerCase();

    if (!city && !state && !line) {
      return { distanceKm: null, provider: this.name, available: false };
    }

    // Optional fixed override for demos
    const fixed = this.config.get<string>('DELIVERY_MOCK_DISTANCE_KM');
    if (fixed && !Number.isNaN(Number(fixed))) {
      return {
        distanceKm: Number(fixed),
        provider: this.name,
        available: true,
      };
    }

    // Deterministic 5–80 km based on string hash (not a real map)
    const key = `${city}|${state}|${line}`;
    let hash = 0;
    for (let i = 0; i < key.length; i += 1) {
      hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
    }
    const distanceKm = 5 + (hash % 76);
    return { distanceKm, provider: this.name, available: true };
  }
}
