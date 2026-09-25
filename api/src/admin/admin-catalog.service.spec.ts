import { BadRequestException } from '@nestjs/common';
import { AdminCatalogService } from './admin-catalog.service';

describe('AdminCatalogService create guards', () => {
  it('requires an image URL on create', async () => {
    const prisma = {
      subcategory: {
        findUnique: jest.fn().mockResolvedValue({ id: 's1' }),
      },
    };
    const service = new AdminCatalogService(
      prisma as never,
      { log: jest.fn() } as never,
    );
    await expect(
      service.createProduct('actor', {
        subcategoryId: 's1',
        name: 'Tile',
        description: 'Demo',
        price: '1000.00',
        imageUrl: '',
        tileSize: 'SIZE_60X60',
      } as never),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('requires tile size on create', async () => {
    const prisma = {
      subcategory: {
        findUnique: jest.fn().mockResolvedValue({ id: 's1' }),
      },
    };
    const service = new AdminCatalogService(
      prisma as never,
      { log: jest.fn() } as never,
    );
    await expect(
      service.createProduct('actor', {
        subcategoryId: 's1',
        name: 'Tile',
        description: 'Demo',
        price: '1000.00',
        imageUrl: '/images/placeholders/product-a.svg',
      } as never),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
