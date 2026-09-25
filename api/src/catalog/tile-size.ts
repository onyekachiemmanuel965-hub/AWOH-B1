/**
 * Authoritative tile size catalog (physical cm).
 * Shared contract — keep aligned with Prisma TileSize enum and web/src/lib/tile-size.ts
 */

export const TILE_SIZE_CODES = [
  'SIZE_60X60',
  'SIZE_40X40',
  'SIZE_25X40',
  'SIZE_25X50',
  'SIZE_30X60',
  'SIZE_120X60',
] as const;

export type TileSizeCode = (typeof TILE_SIZE_CODES)[number];

export type TileSizeDefinition = {
  code: TileSizeCode;
  /** Machine-safe value for APIs (e.g. "60x60") */
  key: string;
  widthCm: number;
  heightCm: number;
  /** CSS aspect-ratio = width / height */
  aspectRatio: number;
  label: string;
};

export const TILE_SIZES: Record<TileSizeCode, TileSizeDefinition> = {
  SIZE_60X60: {
    code: 'SIZE_60X60',
    key: '60x60',
    widthCm: 60,
    heightCm: 60,
    aspectRatio: 1,
    label: '60 × 60 cm',
  },
  SIZE_40X40: {
    code: 'SIZE_40X40',
    key: '40x40',
    widthCm: 40,
    heightCm: 40,
    aspectRatio: 1,
    label: '40 × 40 cm',
  },
  SIZE_25X40: {
    code: 'SIZE_25X40',
    key: '25x40',
    widthCm: 25,
    heightCm: 40,
    aspectRatio: 25 / 40,
    label: '25 × 40 cm',
  },
  SIZE_25X50: {
    code: 'SIZE_25X50',
    key: '25x50',
    widthCm: 25,
    heightCm: 50,
    aspectRatio: 25 / 50,
    label: '25 × 50 cm',
  },
  SIZE_30X60: {
    code: 'SIZE_30X60',
    key: '30x60',
    widthCm: 30,
    heightCm: 60,
    aspectRatio: 30 / 60,
    label: '30 × 60 cm',
  },
  SIZE_120X60: {
    code: 'SIZE_120X60',
    key: '120x60',
    widthCm: 120,
    heightCm: 60,
    aspectRatio: 120 / 60,
    label: '120 × 60 cm',
  },
};

export const TILE_SIZE_OPTIONS = TILE_SIZE_CODES.map(
  (code) => TILE_SIZES[code],
);

export function isTileSizeCode(value: unknown): value is TileSizeCode {
  return (
    typeof value === 'string' &&
    (TILE_SIZE_CODES as readonly string[]).includes(value)
  );
}

export function getTileSize(code: TileSizeCode | null | undefined) {
  if (!code || !isTileSizeCode(code)) return null;
  return TILE_SIZES[code];
}

/** Public API safe representation */
export function toPublicTileSizeFields(
  code: TileSizeCode | null | undefined,
): {
  tileSize: string | null;
  tileSizeLabel: string | null;
  tileAspectRatio: number | null;
} {
  const def = getTileSize(code);
  if (!def) {
    return { tileSize: null, tileSizeLabel: null, tileAspectRatio: null };
  }
  return {
    tileSize: def.key,
    tileSizeLabel: def.label,
    tileAspectRatio: def.aspectRatio,
  };
}
