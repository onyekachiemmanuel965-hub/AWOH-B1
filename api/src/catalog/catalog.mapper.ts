import {
  CatalogStatus,
  Product,
  ProductAvailability,
  ProductImage,
  Subcategory,
  Category,
  TileSize,
} from '@prisma/client';
import { toPublicTileSizeFields } from './tile-size';

type ProductWithRelations = Product & {
  images: ProductImage[];
  subcategory: Subcategory & { category: Category };
};

/** Public product DTO — never includes stockQuantity or internal weight fields. */
export function toPublicProduct(product: ProductWithRelations) {
  const images = [...product.images].sort((a, b) => a.sortOrder - b.sortOrder);
  const tile = toPublicTileSizeFields(product.tileSize as TileSize | null);
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    description: product.description,
    price: product.price.toString(),
    currency: product.currency,
    availability: product.availability,
    featured: product.featured,
    ...tile,
    specs: parseSpecs(product.specsJson),
    category: {
      id: product.subcategory.category.id,
      name: product.subcategory.category.name,
      slug: product.subcategory.category.slug,
    },
    subcategory: {
      id: product.subcategory.id,
      name: product.subcategory.name,
      slug: product.subcategory.slug,
    },
    images: images.map((img) => ({
      id: img.id,
      url: img.url,
      altText: img.altText,
      sortOrder: img.sortOrder,
      isPrimary: img.isPrimary,
    })),
    primaryImage:
      images.find((i) => i.isPrimary)?.url ?? images[0]?.url ?? null,
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString(),
  };
}

export function toPublicCategory(
  category: Category & { subcategories?: Subcategory[] },
) {
  return {
    id: category.id,
    name: category.name,
    slug: category.slug,
    description: category.description,
    imageUrl: category.imageUrl,
    sortOrder: category.sortOrder,
    subcategories: (category.subcategories ?? [])
      .filter((s) => s.status === CatalogStatus.ACTIVE)
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((s) => ({
        id: s.id,
        name: s.name,
        slug: s.slug,
        description: s.description,
        imageUrl: s.imageUrl,
        sortOrder: s.sortOrder,
      })),
  };
}

export function toPublicSubcategory(
  subcategory: Subcategory & { category: Category },
) {
  return {
    id: subcategory.id,
    name: subcategory.name,
    slug: subcategory.slug,
    description: subcategory.description,
    imageUrl: subcategory.imageUrl,
    sortOrder: subcategory.sortOrder,
    category: {
      id: subcategory.category.id,
      name: subcategory.category.name,
      slug: subcategory.category.slug,
    },
  };
}

function parseSpecs(raw: string | null): Record<string, string> | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as Record<string, string>;
    }
    return null;
  } catch {
    return null;
  }
}

export const ACTIVE = CatalogStatus.ACTIVE;
export type { ProductAvailability };
