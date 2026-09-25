/**
 * Authoritative tile size catalog (physical cm).
 * Keep aligned with api/src/catalog/tile-size.ts and Prisma TileSize enum.
 */

export const TILE_SIZE_CODES = [
  "SIZE_60X60",
  "SIZE_40X40",
  "SIZE_25X40",
  "SIZE_25X50",
  "SIZE_30X60",
  "SIZE_120X60",
] as const;

export type TileSizeCode = (typeof TILE_SIZE_CODES)[number];

export type TileSizeDefinition = {
  code: TileSizeCode;
  key: string;
  widthCm: number;
  heightCm: number;
  aspectRatio: number;
  label: string;
};

export const TILE_SIZES: Record<TileSizeCode, TileSizeDefinition> = {
  SIZE_60X60: {
    code: "SIZE_60X60",
    key: "60x60",
    widthCm: 60,
    heightCm: 60,
    aspectRatio: 1,
    label: "60 × 60 cm",
  },
  SIZE_40X40: {
    code: "SIZE_40X40",
    key: "40x40",
    widthCm: 40,
    heightCm: 40,
    aspectRatio: 1,
    label: "40 × 40 cm",
  },
  SIZE_25X40: {
    code: "SIZE_25X40",
    key: "25x40",
    widthCm: 25,
    heightCm: 40,
    aspectRatio: 25 / 40,
    label: "25 × 40 cm",
  },
  SIZE_25X50: {
    code: "SIZE_25X50",
    key: "25x50",
    widthCm: 25,
    heightCm: 50,
    aspectRatio: 25 / 50,
    label: "25 × 50 cm",
  },
  SIZE_30X60: {
    code: "SIZE_30X60",
    key: "30x60",
    widthCm: 30,
    heightCm: 60,
    aspectRatio: 30 / 60,
    label: "30 × 60 cm",
  },
  SIZE_120X60: {
    code: "SIZE_120X60",
    key: "120x60",
    widthCm: 120,
    heightCm: 60,
    aspectRatio: 120 / 60,
    label: "120 × 60 cm",
  },
};

export const TILE_SIZE_OPTIONS = TILE_SIZE_CODES.map(
  (code) => TILE_SIZES[code],
);

export function isTileSizeCode(value: unknown): value is TileSizeCode {
  return (
    typeof value === "string" &&
    (TILE_SIZE_CODES as readonly string[]).includes(value)
  );
}

export function getTileSize(code: TileSizeCode | string | null | undefined) {
  if (!code || !isTileSizeCode(code)) return null;
  return TILE_SIZES[code];
}

/** CSS aspect-ratio value from public product fields or enum code. */
export function tileAspectRatioCss(
  tileSizeCodeOrKey: string | null | undefined,
  aspectRatio?: number | null,
): string {
  if (typeof aspectRatio === "number" && aspectRatio > 0) {
    return String(aspectRatio);
  }
  if (!tileSizeCodeOrKey) return "1";
  if (isTileSizeCode(tileSizeCodeOrKey)) {
    return String(TILE_SIZES[tileSizeCodeOrKey].aspectRatio);
  }
  const byKey = TILE_SIZE_OPTIONS.find((t) => t.key === tileSizeCodeOrKey);
  return byKey ? String(byKey.aspectRatio) : "1";
}
