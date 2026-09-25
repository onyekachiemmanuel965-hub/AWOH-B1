/**
 * Explicit authoritative carton weights (kg) for Stage 07 demo catalog.
 *
 * These values are business-approved tile weight references for seed data.
 * They MUST be written onto Product.weightPerCartonKg at seed time.
 *
 * Runtime delivery calculation MUST read Product.weightPerCartonKg from the
 * database — never derive weight from name, slug, description, sizeHint, or
 * these size labels.
 */
export const EXPLICIT_TILE_CARTON_WEIGHTS_KG = {
  '250x400': '15',
  '300x600': '25',
  '600x600': '32',
  '250x500': '28',
  '1200x600': '33',
} as const;

export type TileSizeKey = keyof typeof EXPLICIT_TILE_CARTON_WEIGHTS_KG;
