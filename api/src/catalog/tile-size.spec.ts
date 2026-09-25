import { TileSize } from '@prisma/client';
import {
  getTileSize,
  isTileSizeCode,
  TILE_SIZE_CODES,
  TILE_SIZES,
  toPublicTileSizeFields,
} from './tile-size';
import { toPublicProduct } from './catalog.mapper';
import { CatalogStatus, ProductAvailability } from '@prisma/client';

describe('tile size catalog', () => {
  it('defines all six supported sizes with correct aspect ratios', () => {
    expect(TILE_SIZE_CODES).toEqual([
      'SIZE_60X60',
      'SIZE_40X40',
      'SIZE_25X40',
      'SIZE_25X50',
      'SIZE_30X60',
      'SIZE_120X60',
    ]);
    expect(TILE_SIZES.SIZE_60X60.aspectRatio).toBe(1);
    expect(TILE_SIZES.SIZE_40X40.aspectRatio).toBe(1);
    expect(TILE_SIZES.SIZE_25X40.aspectRatio).toBe(25 / 40);
    expect(TILE_SIZES.SIZE_25X50.aspectRatio).toBe(0.5);
    expect(TILE_SIZES.SIZE_30X60.aspectRatio).toBe(0.5);
    expect(TILE_SIZES.SIZE_120X60.aspectRatio).toBe(2);
  });

  it('rejects unknown codes', () => {
    expect(isTileSizeCode('SIZE_50X50')).toBe(false);
    expect(isTileSizeCode('60x60')).toBe(false);
    expect(isTileSizeCode('')).toBe(false);
    expect(getTileSize('SIZE_60X60' as never)?.key).toBe('60x60');
  });

  it('maps public-safe fields without weight', () => {
    const fields = toPublicTileSizeFields(TileSize.SIZE_25X40);
    expect(fields).toEqual({
      tileSize: '25x40',
      tileSizeLabel: '25 × 40 cm',
      tileAspectRatio: 25 / 40,
    });
    expect(JSON.stringify(fields)).not.toMatch(/weight|kg/i);
  });
});

describe('public product tile size', () => {
  const base = {
    id: 'p1',
    subcategoryId: 's1',
    name: 'Tile',
    slug: 'tile',
    description: 'd',
    price: { toString: () => '100.00' } as never,
    currency: 'NGN',
    status: CatalogStatus.ACTIVE,
    availability: ProductAvailability.AVAILABLE,
    stockQuantity: 10,
    weightPerCartonKg: { toString: () => '32' } as never,
    specsJson: null,
    featured: false,
    sortOrder: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    images: [],
    subcategory: {
      id: 's1',
      categoryId: 'c1',
      name: 'Porcelain',
      slug: 'porcelain',
      description: null,
      imageUrl: null,
      status: CatalogStatus.ACTIVE,
      sortOrder: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      category: {
        id: 'c1',
        name: 'Tiles',
        slug: 'tiles',
        description: null,
        imageUrl: null,
        status: CatalogStatus.ACTIVE,
        sortOrder: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    },
  };

  it('includes tile size on public DTO and never weight', () => {
    const dto = toPublicProduct({
      ...base,
      tileSize: TileSize.SIZE_120X60,
    } as never);
    expect(dto.tileSize).toBe('120x60');
    expect(dto.tileSizeLabel).toBe('120 × 60 cm');
    expect(dto.tileAspectRatio).toBe(2);
    expect(dto).not.toHaveProperty('weightPerCartonKg');
  });

  it('returns null tile fields when unset (legacy rows)', () => {
    const dto = toPublicProduct({
      ...base,
      tileSize: null,
    } as never);
    expect(dto.tileSize).toBeNull();
    expect(dto.tileSizeLabel).toBeNull();
    expect(dto.tileAspectRatio).toBeNull();
  });
});
