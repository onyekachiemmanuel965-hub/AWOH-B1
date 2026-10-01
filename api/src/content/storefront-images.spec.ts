import {
  STOREFRONT_IMAGE_SLOTS,
  getStorefrontSlot,
} from './storefront-image-slots';
import { StorefrontImagesService } from './storefront-images.service';

describe('storefront image slots', () => {
  it('includes homepage hero and other page banners', () => {
    const keys = STOREFRONT_IMAGE_SLOTS.map((s) => s.key);
    expect(keys).toContain('home.hero');
    expect(keys).toContain('about.hero');
    expect(keys).toContain('contact.hero');
    expect(keys).toContain('products.hero');
    expect(keys).toContain('categories.hero');
    expect(keys.filter((k) => k.startsWith('home.inspire.'))).toHaveLength(4);
  });

  it('resolves known keys only', () => {
    expect(getStorefrontSlot('home.hero')?.page).toBe('home');
    expect(getStorefrontSlot('nope')).toBeNull();
  });
});

describe('StorefrontImagesService public mapping', () => {
  it('falls back to placeholder when no custom upload', async () => {
    const prisma = {
      storefrontImage: {
        findMany: jest.fn().mockResolvedValue([]),
        findUnique: jest.fn().mockResolvedValue(null),
      },
    };
    const service = new StorefrontImagesService(
      prisma as never,
      { contentDir: () => '/tmp', saveContentImage: jest.fn() } as never,
      { log: jest.fn() } as never,
    );
    const list = await service.listPublic('home');
    const hero = list.find((i) => i.key === 'home.hero');
    expect(hero?.isCustom).toBe(false);
    expect(hero?.url).toBe('/images/placeholders/hero-surface.svg');
  });

  it('uses persisted upload url when present', async () => {
    const prisma = {
      storefrontImage: {
        findMany: jest.fn().mockResolvedValue([
          {
            key: 'home.hero',
            url: '/uploads/content/abc.jpg',
            altText: 'Showroom floor',
          },
        ]),
      },
    };
    const service = new StorefrontImagesService(
      prisma as never,
      { contentDir: () => '/tmp', saveContentImage: jest.fn() } as never,
      { log: jest.fn() } as never,
    );
    const list = await service.listPublic('home');
    const hero = list.find((i) => i.key === 'home.hero')!;
    expect(hero.isCustom).toBe(true);
    expect(hero.url).toBe('/uploads/content/abc.jpg');
    expect(hero.altText).toBe('Showroom floor');
  });
});
