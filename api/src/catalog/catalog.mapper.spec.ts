import { toPublicProduct } from './catalog.mapper';
import {
  CatalogStatus,
  ProductAvailability,
} from '@prisma/client';

describe('catalog mapper weight privacy', () => {
  it('never maps weightPerCartonKg or stockQuantity', () => {
    const product = toPublicProduct({
      id: 'p1',
      subcategoryId: 's1',
      name: 'Tile',
      slug: 'tile',
      description: 'd',
      price: { toString: () => '100.00' } as never,
      currency: 'NGN',
      status: CatalogStatus.ACTIVE,
      availability: ProductAvailability.AVAILABLE,
      stockQuantity: 99,
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
    } as never);

    expect(product).not.toHaveProperty('weightPerCartonKg');
    expect(product).not.toHaveProperty('stockQuantity');
    expect(JSON.stringify(product)).not.toMatch(
      /weightPerCartonKg|totalWeight|distanceKm|surcharge/,
    );
  });
});
