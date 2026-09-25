import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { CatalogService } from './catalog.service';
import { PrismaService } from '../prisma/prisma.service';
import { CatalogStatus, ProductAvailability } from '@prisma/client';

function mockProduct(overrides: Record<string, unknown> = {}) {
  return {
    id: 'p1',
    subcategoryId: 's1',
    name: 'Demo Porcelain',
    slug: 'demo-porcelain',
    description: 'Demo product for architectural surfaces',
    price: { toString: () => '12500.00' },
    currency: 'NGN',
    status: CatalogStatus.ACTIVE,
    availability: ProductAvailability.AVAILABLE,
    stockQuantity: 42,
    weightPerCartonKg: null,
    tileSize: 'SIZE_60X60',
    specsJson: '{"finish":"matte"}',
    featured: true,
    sortOrder: 0,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-02'),
    images: [
      {
        id: 'img1',
        productId: 'p1',
        url: '/images/demo.svg',
        altText: 'Demo',
        sortOrder: 0,
        isPrimary: true,
        createdAt: new Date(),
      },
    ],
    subcategory: {
      id: 's1',
      name: 'Porcelain',
      slug: 'porcelain',
      categoryId: 'c1',
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
    ...overrides,
  };
}

describe('CatalogService', () => {
  let service: CatalogService;
  let prisma: {
    category: { findMany: jest.Mock; findFirst: jest.Mock };
    subcategory: { findFirst: jest.Mock };
    product: {
      count: jest.Mock;
      findMany: jest.Mock;
      findFirst: jest.Mock;
    };
    $transaction: jest.Mock;
  };

  beforeEach(async () => {
    prisma = {
      category: { findMany: jest.fn(), findFirst: jest.fn() },
      subcategory: { findFirst: jest.fn() },
      product: {
        count: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
      },
      $transaction: jest.fn(async (ops: unknown[]) =>
        Promise.all(ops as Promise<unknown>[]),
      ),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CatalogService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get(CatalogService);
  });

  it('lists active categories with public shape', async () => {
    prisma.category.findMany.mockResolvedValue([
      {
        id: 'c1',
        name: 'Tiles',
        slug: 'tiles',
        description: 'Demo',
        imageUrl: null,
        status: CatalogStatus.ACTIVE,
        sortOrder: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        subcategories: [
          {
            id: 's1',
            categoryId: 'c1',
            name: 'Porcelain',
            slug: 'porcelain',
            description: null,
            imageUrl: null,
            status: CatalogStatus.ACTIVE,
            sortOrder: 1,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
      },
    ]);

    const result = await service.listCategories();
    expect(result).toHaveLength(1);
    expect(result[0].slug).toBe('tiles');
    expect(result[0].subcategories[0].slug).toBe('porcelain');
  });

  it('throws when category slug is missing', async () => {
    prisma.category.findFirst.mockResolvedValue(null);
    await expect(service.getCategoryBySlug('missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('throws when subcategory is missing', async () => {
    prisma.subcategory.findFirst.mockResolvedValue(null);
    await expect(
      service.getSubcategory('tiles', 'missing'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('throws when product slug is missing', async () => {
    prisma.product.findFirst.mockResolvedValue(null);
    await expect(service.getProductBySlug('missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('returns public product without stockQuantity', async () => {
    prisma.product.findFirst.mockResolvedValue(mockProduct());

    const product = await service.getProductBySlug('demo-porcelain');
    expect(product.price).toBe('12500.00');
    expect(product.availability).toBe('AVAILABLE');
    expect(product.specs).toEqual({ finish: 'matte' });
    expect(product).not.toHaveProperty('stockQuantity');
    expect(product).not.toHaveProperty('weightPerCartonKg');
    expect(JSON.stringify(product)).not.toMatch(/weightPerCartonKg|totalWeight|distanceKm/);
    expect(product.category.slug).toBe('tiles');
    expect(product.subcategory.slug).toBe('porcelain');
  });

  it('paginates product listing with safe limit', async () => {
    prisma.product.count.mockResolvedValue(2);
    prisma.product.findMany.mockResolvedValue([]);
    const result = await service.listProducts({ page: 1, limit: 100 } as never);
    expect(result.meta.limit).toBe(48);
    expect(result.meta.page).toBe(1);
  });

  it('filters by category and subcategory slugs', async () => {
    prisma.product.count.mockResolvedValue(1);
    prisma.product.findMany.mockResolvedValue([mockProduct()]);
    await service.listProducts({
      category: 'tiles',
      subcategory: 'porcelain',
      page: 1,
      limit: 12,
    });
    expect(prisma.product.findMany).toHaveBeenCalled();
    const args = prisma.product.findMany.mock.calls[0][0];
    expect(args.where.subcategory.slug).toBe('porcelain');
    expect(args.where.subcategory.category.slug).toBe('tiles');
  });

  it('applies search on name and description', async () => {
    prisma.product.count.mockResolvedValue(0);
    prisma.product.findMany.mockResolvedValue([]);
    await service.listProducts({ q: 'porcelain', page: 1, limit: 12 });
    const args = prisma.product.findMany.mock.calls[0][0];
    expect(args.where.OR).toEqual([
      { name: { contains: 'porcelain' } },
      { description: { contains: 'porcelain' } },
    ]);
  });

  it('sorts by price ascending when requested', async () => {
    prisma.product.count.mockResolvedValue(0);
    prisma.product.findMany.mockResolvedValue([]);
    await service.listProducts({ sort: 'price_asc', page: 1, limit: 12 });
    const args = prisma.product.findMany.mock.calls[0][0];
    expect(args.orderBy).toEqual([{ price: 'asc' }]);
  });

  it('resolves products by id without trusting client prices', async () => {
    prisma.product.findMany.mockResolvedValue([mockProduct()]);
    const rows = await service.resolveProductsByIds(['p1', 'p1', '']);
    expect(rows).toHaveLength(1);
    expect(rows[0].price).toBe('12500.00');
    expect(rows[0]).not.toHaveProperty('stockQuantity');
  });
});
