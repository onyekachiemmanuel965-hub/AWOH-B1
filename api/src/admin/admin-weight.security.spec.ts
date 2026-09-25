import { BadRequestException } from '@nestjs/common';
import { AdminCatalogService } from './admin-catalog.service';
import { toPublicProduct } from '../catalog/catalog.mapper';
import { calculateDeliveryQuote } from '../delivery/delivery.calculator';
import {
  CatalogStatus,
  ProductAvailability,
} from '@prisma/client';

describe('weightPerCartonKg mutation security', () => {
  it('rejects invalid weight values', async () => {
    const prisma = {
      product: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'p1',
          weightPerCartonKg: { toString: () => '32' },
        }),
      },
    };
    const service = new AdminCatalogService(
      prisma as never,
      { log: jest.fn() } as never,
    );
    await expect(
      service.updateInventory('actor', 'p1', {
        weightPerCartonKg: '-1',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    await expect(
      service.updateInventory('actor', 'p1', {
        weightPerCartonKg: 'not-a-number',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('audits weight before/after on authorized update', async () => {
    const existing = {
      id: 'p1',
      weightPerCartonKg: { toString: () => '32.00' },
    };
    const updated = {
      id: 'p1',
      name: 'Tile',
      slug: 'tile',
      description: 'd',
      price: { toString: () => '1000.00' },
      currency: 'NGN',
      status: CatalogStatus.ACTIVE,
      availability: ProductAvailability.AVAILABLE,
      stockQuantity: 5,
      weightPerCartonKg: { toString: () => '33.00' },
      specsJson: null,
      featured: false,
      sortOrder: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      images: [],
      subcategory: {
        id: 's1',
        name: 'Porcelain',
        slug: 'porcelain',
        category: { id: 'c1', name: 'Tiles', slug: 'tiles' },
      },
    };
    const auditLog = jest.fn().mockResolvedValue(undefined);
    const prisma = {
      product: {
        findUnique: jest.fn().mockResolvedValue(existing),
        update: jest.fn().mockResolvedValue(updated),
      },
    };
    const service = new AdminCatalogService(
      prisma as never,
      { log: auditLog } as never,
    );
    await service.updateInventory('inv-1', 'p1', {
      weightPerCartonKg: '33',
    });
    expect(auditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'inventory.update',
        entityId: 'p1',
        metadata: expect.objectContaining({
          weightBefore: '32.00',
          weightAfter: '33.00',
          weightChanged: true,
        }),
      }),
    );
  });

  it('CONTENT create ignores client-supplied weight/stock', async () => {
    const created = {
      id: 'p1',
      name: 'Tile',
      slug: 'tile',
      description: 'd',
      price: { toString: () => '1000.00' },
      currency: 'NGN',
      status: CatalogStatus.ACTIVE,
      availability: ProductAvailability.AVAILABLE,
      stockQuantity: 0,
      weightPerCartonKg: null,
      specsJson: null,
      featured: false,
      sortOrder: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      images: [
        {
          id: 'i1',
          url: '/x.png',
          altText: null,
          sortOrder: 0,
          isPrimary: true,
        },
      ],
      subcategory: {
        id: 's1',
        name: 'Porcelain',
        slug: 'porcelain',
        category: { id: 'c1', name: 'Tiles', slug: 'tiles' },
      },
    };
    const create = jest.fn().mockResolvedValue(created);
    const prisma = {
      subcategory: { findUnique: jest.fn().mockResolvedValue({ id: 's1' }) },
      product: { create },
    };
    const service = new AdminCatalogService(
      prisma as never,
      { log: jest.fn() } as never,
    );
    await service.createProduct(
      'content-1',
      {
        subcategoryId: 's1',
        name: 'Tile',
        description: 'd',
        price: '1000.00',
        imageUrl: '/images/placeholders/product-a.svg',
        stockQuantity: 99,
        weightPerCartonKg: '32',
        tileSize: 'SIZE_60X60',
      } as never,
      undefined,
      { allowInventoryFields: false },
    );
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          stockQuantity: 0,
          weightPerCartonKg: null,
        }),
      }),
    );
  });

  it('public product DTO never exposes weight after mutation', () => {
    const publicDto = toPublicProduct({
      id: 'p1',
      subcategoryId: 's1',
      name: 'Tile 600x600',
      slug: 'tile',
      description: 'd',
      price: { toString: () => '100.00' } as never,
      currency: 'NGN',
      status: CatalogStatus.ACTIVE,
      availability: ProductAvailability.AVAILABLE,
      stockQuantity: 10,
      weightPerCartonKg: { toString: () => '99' } as never,
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
    expect(publicDto).not.toHaveProperty('weightPerCartonKg');
    expect(JSON.stringify(publicDto)).not.toContain('weightPerCartonKg');
  });

  it('delivery calculator uses authoritative DB weight, not product name', () => {
    const result = calculateDeliveryQuote(
      [
        {
          productId: 'p1',
          quantity: 2,
          weightPerCartonKg: 28, // DB value for 250x500
          productName: '600x600 Should Not Infer 32kg',
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
    expect(result.totalWeightKg).toBe(56); // 28×2 from DB, not 32×2
  });
});
