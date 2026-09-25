import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ListProductsQueryDto } from './dto/list-products.query.dto';
import {
  ACTIVE,
  toPublicCategory,
  toPublicProduct,
  toPublicSubcategory,
} from './catalog.mapper';

const productInclude = {
  images: true,
  subcategory: { include: { category: true } },
} satisfies Prisma.ProductInclude;

@Injectable()
export class CatalogService {
  constructor(private readonly prisma: PrismaService) {}

  async listCategories() {
    const categories = await this.prisma.category.findMany({
      where: { status: ACTIVE },
      include: { subcategories: true },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
    return categories.map(toPublicCategory);
  }

  async getCategoryBySlug(slug: string) {
    const category = await this.prisma.category.findFirst({
      where: { slug, status: ACTIVE },
      include: { subcategories: true },
    });
    if (!category) {
      throw new NotFoundException('Category not found');
    }
    return toPublicCategory(category);
  }

  async getSubcategory(categorySlug: string, subcategorySlug: string) {
    const subcategory = await this.prisma.subcategory.findFirst({
      where: {
        slug: subcategorySlug,
        status: ACTIVE,
        category: { slug: categorySlug, status: ACTIVE },
      },
      include: { category: true },
    });
    if (!subcategory) {
      throw new NotFoundException('Subcategory not found');
    }
    return toPublicSubcategory(subcategory);
  }

  async listProducts(query: ListProductsQueryDto) {
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 12, 48);
    const where: Prisma.ProductWhereInput = {
      status: ACTIVE,
      subcategory: {
        status: ACTIVE,
        category: { status: ACTIVE },
      },
    };

    if (query.category) {
      where.subcategory = {
        ...(where.subcategory as Prisma.SubcategoryWhereInput),
        category: {
          status: ACTIVE,
          slug: query.category,
        },
      };
    }

    if (query.subcategory) {
      where.subcategory = {
        ...(where.subcategory as Prisma.SubcategoryWhereInput),
        slug: query.subcategory,
        status: ACTIVE,
        category: {
          status: ACTIVE,
          ...(query.category ? { slug: query.category } : {}),
        },
      };
    }

    if (query.q?.trim()) {
      const q = query.q.trim();
      where.OR = [
        { name: { contains: q } },
        { description: { contains: q } },
      ];
    }

    if (query.featured === true) {
      where.featured = true;
    }

    const orderBy = this.resolveSort(query.sort);

    const [total, rows] = await this.prisma.$transaction([
      this.prisma.product.count({ where }),
      this.prisma.product.findMany({
        where,
        include: productInclude,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return {
      data: rows.map(toPublicProduct),
      meta: {
        total,
        page,
        limit,
        pageCount: Math.max(1, Math.ceil(total / limit)),
      },
    };
  }

  async getProductBySlug(slug: string) {
    const product = await this.prisma.product.findFirst({
      where: {
        slug,
        status: ACTIVE,
        subcategory: {
          status: ACTIVE,
          category: { status: ACTIVE },
        },
      },
      include: productInclude,
    });
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    return toPublicProduct(product);
  }

  async resolveProductsByIds(ids: string[]) {
    const unique = [...new Set(ids.map((id) => id.trim()).filter(Boolean))].slice(
      0,
      50,
    );
    if (unique.length === 0) {
      return [];
    }
    const rows = await this.prisma.product.findMany({
      where: {
        id: { in: unique },
        status: ACTIVE,
        subcategory: {
          status: ACTIVE,
          category: { status: ACTIVE },
        },
      },
      include: productInclude,
    });
    return rows.map(toPublicProduct);
  }

  private resolveSort(
    sort?: ListProductsQueryDto['sort'],
  ): Prisma.ProductOrderByWithRelationInput[] {
    switch (sort) {
      case 'name_asc':
        return [{ name: 'asc' }];
      case 'name_desc':
        return [{ name: 'desc' }];
      case 'price_asc':
        return [{ price: 'asc' }];
      case 'price_desc':
        return [{ price: 'desc' }];
      case 'newest':
      default:
        return [{ createdAt: 'desc' }, { sortOrder: 'asc' }];
    }
  }
}
