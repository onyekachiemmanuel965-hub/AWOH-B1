import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  CatalogStatus,
  Prisma,
  ProductAvailability,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { toMinorUnits, fromMinorUnits } from '../common/money';
import { slugify } from './admin.util';
import { toStaffProduct } from './admin.mapper';
import {
  AdminProductsQueryDto,
  CreateCategoryDto,
  CreateProductDto,
  CreateSubcategoryDto,
  UpdateCategoryDto,
  UpdateInventoryDto,
  UpdateProductContentDto,
  UpdateProductPriceDto,
  UpdateSubcategoryDto,
} from './dto/admin.dto';

const productInclude = {
  images: true,
  subcategory: { include: { category: true } },
} satisfies Prisma.ProductInclude;

@Injectable()
export class AdminCatalogService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  private staffOpts(role: string) {
    const isAdmin = role === 'ADMIN';
    const inventory =
      isAdmin || role === 'INVENTORY_MANAGER';
    return {
      includeInventory: inventory || isAdmin || role === 'CONTENT_MANAGER',
      includeWeight: inventory || isAdmin,
    };
  }

  async listCategories() {
    const rows = await this.prisma.category.findMany({
      include: { subcategories: { orderBy: { sortOrder: 'asc' } } },
      orderBy: { sortOrder: 'asc' },
    });
    return rows.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      description: c.description,
      imageUrl: c.imageUrl,
      status: c.status,
      sortOrder: c.sortOrder,
      subcategoryCount: c.subcategories.length,
      subcategories: c.subcategories.map((s) => ({
        id: s.id,
        name: s.name,
        slug: s.slug,
        status: s.status,
        sortOrder: s.sortOrder,
      })),
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
    }));
  }

  async createCategory(actorUserId: string, dto: CreateCategoryDto, ip?: string) {
    const slug = dto.slug?.trim() || slugify(dto.name);
    try {
      const created = await this.prisma.category.create({
        data: {
          name: dto.name.trim(),
          slug,
          description: dto.description?.trim() || null,
          imageUrl: dto.imageUrl?.trim() || null,
          status: dto.status ?? CatalogStatus.ACTIVE,
          sortOrder: dto.sortOrder ?? 0,
        },
      });
      await this.audit.log({
        actorUserId,
        action: 'category.create',
        entityType: 'Category',
        entityId: created.id,
        ip,
        metadata: { slug: created.slug, name: created.name },
      });
      return created;
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw new ConflictException('Category slug already exists.');
      }
      throw err;
    }
  }

  async updateCategory(
    actorUserId: string,
    id: string,
    dto: UpdateCategoryDto,
    ip?: string,
  ) {
    const existing = await this.prisma.category.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Category not found.');
    try {
      const updated = await this.prisma.category.update({
        where: { id },
        data: {
          name: dto.name?.trim(),
          slug: dto.slug?.trim(),
          description:
            dto.description === undefined
              ? undefined
              : dto.description?.trim() || null,
          imageUrl:
            dto.imageUrl === undefined ? undefined : dto.imageUrl?.trim() || null,
          status: dto.status,
          sortOrder: dto.sortOrder,
        },
      });
      await this.audit.log({
        actorUserId,
        action: 'category.update',
        entityType: 'Category',
        entityId: id,
        ip,
        metadata: { before: existing.slug, after: updated.slug },
      });
      return updated;
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw new ConflictException('Category slug already exists.');
      }
      throw err;
    }
  }

  async deactivateCategory(actorUserId: string, id: string, ip?: string) {
    const existing = await this.prisma.category.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Category not found.');
    const updated = await this.prisma.category.update({
      where: { id },
      data: { status: CatalogStatus.INACTIVE },
    });
    await this.audit.log({
      actorUserId,
      action: 'category.deactivate',
      entityType: 'Category',
      entityId: id,
      ip,
    });
    return updated;
  }

  async listSubcategories(categoryId?: string) {
    const rows = await this.prisma.subcategory.findMany({
      where: categoryId ? { categoryId } : undefined,
      include: { category: true, _count: { select: { products: true } } },
      orderBy: [{ categoryId: 'asc' }, { sortOrder: 'asc' }],
    });
    return rows.map((s) => ({
      id: s.id,
      name: s.name,
      slug: s.slug,
      description: s.description,
      imageUrl: s.imageUrl,
      status: s.status,
      sortOrder: s.sortOrder,
      productCount: s._count.products,
      category: {
        id: s.category.id,
        name: s.category.name,
        slug: s.category.slug,
      },
      createdAt: s.createdAt.toISOString(),
      updatedAt: s.updatedAt.toISOString(),
    }));
  }

  async createSubcategory(
    actorUserId: string,
    dto: CreateSubcategoryDto,
    ip?: string,
  ) {
    const category = await this.prisma.category.findUnique({
      where: { id: dto.categoryId },
    });
    if (!category) throw new BadRequestException('Category not found.');
    const slug = dto.slug?.trim() || slugify(dto.name);
    try {
      const created = await this.prisma.subcategory.create({
        data: {
          categoryId: dto.categoryId,
          name: dto.name.trim(),
          slug,
          description: dto.description?.trim() || null,
          imageUrl: dto.imageUrl?.trim() || null,
          status: dto.status ?? CatalogStatus.ACTIVE,
          sortOrder: dto.sortOrder ?? 0,
        },
        include: { category: true },
      });
      await this.audit.log({
        actorUserId,
        action: 'subcategory.create',
        entityType: 'Subcategory',
        entityId: created.id,
        ip,
        metadata: { slug: created.slug, categoryId: created.categoryId },
      });
      return created;
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw new ConflictException('Subcategory slug already exists in category.');
      }
      throw err;
    }
  }

  async updateSubcategory(
    actorUserId: string,
    id: string,
    dto: UpdateSubcategoryDto,
    ip?: string,
  ) {
    const existing = await this.prisma.subcategory.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Subcategory not found.');
    if (dto.categoryId) {
      const cat = await this.prisma.category.findUnique({
        where: { id: dto.categoryId },
      });
      if (!cat) throw new BadRequestException('Category not found.');
    }
    try {
      const updated = await this.prisma.subcategory.update({
        where: { id },
        data: {
          categoryId: dto.categoryId,
          name: dto.name?.trim(),
          slug: dto.slug?.trim(),
          description:
            dto.description === undefined
              ? undefined
              : dto.description?.trim() || null,
          imageUrl:
            dto.imageUrl === undefined ? undefined : dto.imageUrl?.trim() || null,
          status: dto.status,
          sortOrder: dto.sortOrder,
        },
        include: { category: true },
      });
      await this.audit.log({
        actorUserId,
        action: 'subcategory.update',
        entityType: 'Subcategory',
        entityId: id,
        ip,
      });
      return updated;
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw new ConflictException('Subcategory slug already exists in category.');
      }
      throw err;
    }
  }

  async deactivateSubcategory(actorUserId: string, id: string, ip?: string) {
    const existing = await this.prisma.subcategory.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Subcategory not found.');
    const updated = await this.prisma.subcategory.update({
      where: { id },
      data: { status: CatalogStatus.INACTIVE },
    });
    await this.audit.log({
      actorUserId,
      action: 'subcategory.deactivate',
      entityType: 'Subcategory',
      entityId: id,
      ip,
    });
    return updated;
  }

  async listProducts(query: AdminProductsQueryDto, role: string) {
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 20, 100);
    const where: Prisma.ProductWhereInput = {};
    if (query.status) where.status = query.status;
    if (query.availability) where.availability = query.availability;
    if (query.q?.trim()) {
      const q = query.q.trim();
      where.OR = [
        { name: { contains: q } },
        { slug: { contains: q } },
        { description: { contains: q } },
      ];
    }
    const [total, rows] = await this.prisma.$transaction([
      this.prisma.product.count({ where }),
      this.prisma.product.findMany({
        where,
        include: productInclude,
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);
    const opts = this.staffOpts(role);
    return {
      data: rows.map((p) => toStaffProduct(p, opts)),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  }

  async getProduct(id: string, role: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: productInclude,
    });
    if (!product) throw new NotFoundException('Product not found.');
    return toStaffProduct(product, this.staffOpts(role));
  }

  async createProduct(
    actorUserId: string,
    dto: CreateProductDto,
    ip?: string,
    opts: { allowInventoryFields?: boolean } = {},
  ) {
    const sub = await this.prisma.subcategory.findUnique({
      where: { id: dto.subcategoryId },
    });
    if (!sub) throw new BadRequestException('Subcategory not found.');
    if (!dto.imageUrl?.trim()) {
      throw new BadRequestException('At least one product image is required.');
    }
    if (!dto.tileSize) {
      throw new BadRequestException('Tile size is required.');
    }
    let price: string;
    try {
      price = fromMinorUnits(toMinorUnits(dto.price));
    } catch {
      throw new BadRequestException('Invalid price.');
    }

    // weight/stock are inventory fields — only ADMIN (or inventory-capable create) may set them
    const allowInventory = opts.allowInventoryFields === true;
    let weight: string | null = null;
    let stockQuantity = 0;
    if (allowInventory) {
      stockQuantity = dto.stockQuantity ?? 0;
      if (dto.weightPerCartonKg != null && dto.weightPerCartonKg !== '') {
        const n = Number(dto.weightPerCartonKg);
        if (!Number.isFinite(n) || n < 0) {
          throw new BadRequestException('Invalid weightPerCartonKg.');
        }
        weight = n.toFixed(2);
      }
    }

    const slug = dto.slug?.trim() || slugify(dto.name);
    try {
      const created = await this.prisma.product.create({
        data: {
          subcategoryId: dto.subcategoryId,
          name: dto.name.trim(),
          slug,
          description: dto.description.trim(),
          price,
          status: dto.status ?? CatalogStatus.ACTIVE,
          availability: dto.availability ?? ProductAvailability.AVAILABLE,
          stockQuantity,
          weightPerCartonKg: weight,
          tileSize: dto.tileSize,
          specsJson: dto.specsJson?.trim() || null,
          featured: dto.featured ?? false,
          sortOrder: dto.sortOrder ?? 0,
          images: {
            create: {
              url: dto.imageUrl.trim(),
              altText: dto.imageAltText?.trim() || null,
              sortOrder: 0,
              isPrimary: true,
            },
          },
        },
        include: productInclude,
      });
      await this.audit.log({
        actorUserId,
        action: 'product.create',
        entityType: 'Product',
        entityId: created.id,
        ip,
        metadata: {
          slug: created.slug,
          price,
          inventoryFieldsApplied: allowInventory,
        },
      });
      return toStaffProduct(created, {
        includeInventory: true,
        includeWeight: true,
      });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw new ConflictException('Product slug already exists.');
      }
      throw err;
    }
  }

  async updateProductContent(
    actorUserId: string,
    id: string,
    dto: UpdateProductContentDto,
    ip?: string,
  ) {
    const existing = await this.prisma.product.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Product not found.');
    if (dto.subcategoryId) {
      const sub = await this.prisma.subcategory.findUnique({
        where: { id: dto.subcategoryId },
      });
      if (!sub) throw new BadRequestException('Subcategory not found.');
    }
    try {
      const updated = await this.prisma.product.update({
        where: { id },
        data: {
          subcategoryId: dto.subcategoryId,
          name: dto.name?.trim(),
          slug: dto.slug?.trim(),
          description: dto.description?.trim(),
          status: dto.status,
          featured: dto.featured,
          sortOrder: dto.sortOrder,
          tileSize: dto.tileSize,
          specsJson:
            dto.specsJson === undefined
              ? undefined
              : dto.specsJson?.trim() || null,
        },
        include: productInclude,
      });
      await this.audit.log({
        actorUserId,
        action: 'product.update',
        entityType: 'Product',
        entityId: id,
        ip,
        metadata: { fields: Object.keys(dto) },
      });
      return toStaffProduct(updated, {
        includeInventory: true,
        includeWeight: true,
      });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw new ConflictException('Product slug already exists.');
      }
      throw err;
    }
  }

  async updateProductPrice(
    actorUserId: string,
    id: string,
    dto: UpdateProductPriceDto,
    ip?: string,
  ) {
    const existing = await this.prisma.product.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Product not found.');
    let price: string;
    try {
      price = fromMinorUnits(toMinorUnits(dto.price));
    } catch {
      throw new BadRequestException('Invalid price.');
    }
    const updated = await this.prisma.product.update({
      where: { id },
      data: { price },
      include: productInclude,
    });
    await this.audit.log({
      actorUserId,
      action: 'product.price_update',
      entityType: 'Product',
      entityId: id,
      ip,
      metadata: {
        before: existing.price.toString(),
        after: price,
      },
    });
    return toStaffProduct(updated, {
      includeInventory: true,
      includeWeight: true,
    });
  }

  async updateInventory(
    actorUserId: string,
    id: string,
    dto: UpdateInventoryDto,
    ip?: string,
  ) {
    const existing = await this.prisma.product.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Product not found.');
    if (
      dto.stockQuantity === undefined &&
      dto.availability === undefined &&
      dto.weightPerCartonKg === undefined
    ) {
      throw new BadRequestException('No inventory fields provided.');
    }
    let weight: string | null | undefined = undefined;
    if (dto.weightPerCartonKg !== undefined) {
      if (dto.weightPerCartonKg === null || dto.weightPerCartonKg === '') {
        weight = null;
      } else {
        const n = Number(dto.weightPerCartonKg);
        if (!Number.isFinite(n) || n < 0) {
          throw new BadRequestException('Invalid weightPerCartonKg.');
        }
        weight = n.toFixed(2);
      }
    }
    const updated = await this.prisma.product.update({
      where: { id },
      data: {
        stockQuantity: dto.stockQuantity,
        availability: dto.availability,
        weightPerCartonKg: weight,
      },
      include: productInclude,
    });
    await this.audit.log({
      actorUserId,
      action: 'inventory.update',
      entityType: 'Product',
      entityId: id,
      ip,
      metadata: {
        stockQuantity: dto.stockQuantity ?? null,
        availability: dto.availability ?? null,
        weightBefore: existing.weightPerCartonKg?.toString() ?? null,
        weightAfter:
          weight === undefined
            ? existing.weightPerCartonKg?.toString() ?? null
            : weight,
        weightChanged: weight !== undefined,
      },
    });
    return toStaffProduct(updated, {
      includeInventory: true,
      includeWeight: true,
    });
  }

  async deactivateProduct(actorUserId: string, id: string, ip?: string) {
    const existing = await this.prisma.product.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Product not found.');
    const updated = await this.prisma.product.update({
      where: { id },
      data: {
        status: CatalogStatus.INACTIVE,
        availability: ProductAvailability.UNAVAILABLE,
      },
      include: productInclude,
    });
    await this.audit.log({
      actorUserId,
      action: 'product.deactivate',
      entityType: 'Product',
      entityId: id,
      ip,
    });
    return toStaffProduct(updated, {
      includeInventory: true,
      includeWeight: true,
    });
  }

  async addImage(
    actorUserId: string,
    productId: string,
    url: string,
    altText?: string,
    ip?: string,
  ) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: { images: true },
    });
    if (!product) throw new NotFoundException('Product not found.');
    const maxSort = product.images.reduce((m, i) => Math.max(m, i.sortOrder), -1);
    const image = await this.prisma.productImage.create({
      data: {
        productId,
        url,
        altText: altText?.trim() || null,
        sortOrder: maxSort + 1,
        isPrimary: product.images.length === 0,
      },
    });
    await this.audit.log({
      actorUserId,
      action: 'product.image_add',
      entityType: 'ProductImage',
      entityId: image.id,
      ip,
      metadata: { productId },
    });
    return image;
  }

  async removeImage(actorUserId: string, productId: string, imageId: string, ip?: string) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: { images: true },
    });
    if (!product) throw new NotFoundException('Product not found.');
    const image = product.images.find((i) => i.id === imageId);
    if (!image) throw new NotFoundException('Image not found.');
    if (product.images.length <= 1) {
      throw new BadRequestException(
        'A product must retain at least one image. Add another before removing.',
      );
    }
    await this.prisma.productImage.delete({ where: { id: imageId } });
    if (image.isPrimary) {
      const next = product.images.find((i) => i.id !== imageId);
      if (next) {
        await this.prisma.productImage.update({
          where: { id: next.id },
          data: { isPrimary: true },
        });
      }
    }
    await this.audit.log({
      actorUserId,
      action: 'product.image_remove',
      entityType: 'ProductImage',
      entityId: imageId,
      ip,
      metadata: { productId },
    });
    return { ok: true };
  }

  async setPrimaryImage(
    actorUserId: string,
    productId: string,
    imageId: string,
    ip?: string,
  ) {
    const image = await this.prisma.productImage.findFirst({
      where: { id: imageId, productId },
    });
    if (!image) throw new NotFoundException('Image not found.');
    await this.prisma.$transaction([
      this.prisma.productImage.updateMany({
        where: { productId },
        data: { isPrimary: false },
      }),
      this.prisma.productImage.update({
        where: { id: imageId },
        data: { isPrimary: true },
      }),
    ]);
    await this.audit.log({
      actorUserId,
      action: 'product.image_primary',
      entityType: 'ProductImage',
      entityId: imageId,
      ip,
      metadata: { productId },
    });
    return { ok: true };
  }
}
