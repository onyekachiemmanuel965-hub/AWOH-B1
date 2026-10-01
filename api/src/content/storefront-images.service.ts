import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { unlinkSync, existsSync } from 'fs';
import { join } from 'path';
import { PrismaService } from '../prisma/prisma.service';
import { AdminUploadService } from '../admin/admin-upload.service';
import { AuditService } from '../audit/audit.service';
import {
  STOREFRONT_IMAGE_SLOTS,
  getStorefrontSlot,
} from './storefront-image-slots';

export type PublicStorefrontImage = {
  key: string;
  page: string;
  label: string;
  url: string;
  altText: string;
  isCustom: boolean;
};

@Injectable()
export class StorefrontImagesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly uploads: AdminUploadService,
    private readonly audit: AuditService,
  ) {}

  private resolvePublic(
    slot: (typeof STOREFRONT_IMAGE_SLOTS)[number],
    row: { url: string | null; altText: string | null } | null,
  ): PublicStorefrontImage {
    const customUrl = row?.url?.trim() || null;
    return {
      key: slot.key,
      page: slot.page,
      label: slot.label,
      url: customUrl || slot.placeholderPath,
      altText: row?.altText?.trim() || slot.placeholderAlt,
      isCustom: Boolean(customUrl),
    };
  }

  async listPublic(page?: string): Promise<PublicStorefrontImage[]> {
    const slots = page
      ? STOREFRONT_IMAGE_SLOTS.filter((s) => s.page === page)
      : STOREFRONT_IMAGE_SLOTS;
    const rows = await this.prisma.storefrontImage.findMany({
      where: { key: { in: slots.map((s) => s.key) } },
    });
    const byKey = new Map(rows.map((r) => [r.key, r]));
    return slots.map((slot) => this.resolvePublic(slot, byKey.get(slot.key) ?? null));
  }

  async getPublic(key: string): Promise<PublicStorefrontImage> {
    const slot = getStorefrontSlot(key);
    if (!slot) throw new NotFoundException('Unknown storefront image key.');
    const row = await this.prisma.storefrontImage.findUnique({ where: { key } });
    return this.resolvePublic(slot, row);
  }

  async listAdmin() {
    const rows = await this.prisma.storefrontImage.findMany();
    const byKey = new Map(rows.map((r) => [r.key, r]));
    return STOREFRONT_IMAGE_SLOTS.map((slot) => {
      const row = byKey.get(slot.key);
      const resolved = this.resolvePublic(slot, row ?? null);
      return {
        ...resolved,
        description: slot.description,
        placeholderPath: slot.placeholderPath,
        updatedAt: row?.updatedAt?.toISOString() ?? null,
      };
    });
  }

  async upload(
    actorUserId: string,
    key: string,
    file: Express.Multer.File,
    altText: string | undefined,
    ip?: string,
  ) {
    const slot = getStorefrontSlot(key);
    if (!slot) throw new BadRequestException('Unknown storefront image key.');
    if (!file) throw new BadRequestException('Empty upload.');

    const previous = await this.prisma.storefrontImage.findUnique({
      where: { key },
    });
    const url = await this.uploads.saveContentImage(file);
    const nextAlt = altText?.trim() || previous?.altText || slot.placeholderAlt;

    const row = await this.prisma.storefrontImage.upsert({
      where: { key },
      create: {
        key: slot.key,
        page: slot.page,
        label: slot.label,
        url,
        altText: nextAlt,
        updatedById: actorUserId,
      },
      update: {
        url,
        altText: nextAlt,
        label: slot.label,
        page: slot.page,
        updatedById: actorUserId,
      },
    });

    this.tryDeleteUploadFile(previous?.url);

    await this.audit.log({
      actorUserId,
      action: 'storefront_image.uploaded',
      entityType: 'StorefrontImage',
      entityId: row.id,
      metadata: { key, url },
      ip,
    });

    return this.resolvePublic(slot, row);
  }

  async updateMeta(
    actorUserId: string,
    key: string,
    altText: string | undefined,
    ip?: string,
  ) {
    const slot = getStorefrontSlot(key);
    if (!slot) throw new BadRequestException('Unknown storefront image key.');
    const existing = await this.prisma.storefrontImage.findUnique({
      where: { key },
    });
    if (!existing?.url) {
      throw new BadRequestException(
        'Upload an image before editing alt text, or clear to use the placeholder.',
      );
    }
    const row = await this.prisma.storefrontImage.update({
      where: { key },
      data: {
        altText: altText?.trim() || slot.placeholderAlt,
        updatedById: actorUserId,
      },
    });
    await this.audit.log({
      actorUserId,
      action: 'storefront_image.updated',
      entityType: 'StorefrontImage',
      entityId: row.id,
      metadata: { key },
      ip,
    });
    return this.resolvePublic(slot, row);
  }

  /** Clear custom upload and revert to placeholder. */
  async clear(actorUserId: string, key: string, ip?: string) {
    const slot = getStorefrontSlot(key);
    if (!slot) throw new BadRequestException('Unknown storefront image key.');
    const existing = await this.prisma.storefrontImage.findUnique({
      where: { key },
    });
    if (!existing) {
      return this.resolvePublic(slot, null);
    }
    await this.prisma.storefrontImage.delete({ where: { key } });
    this.tryDeleteUploadFile(existing.url);
    await this.audit.log({
      actorUserId,
      action: 'storefront_image.cleared',
      entityType: 'StorefrontImage',
      entityId: existing.id,
      metadata: { key },
      ip,
    });
    return this.resolvePublic(slot, null);
  }

  private tryDeleteUploadFile(url: string | null | undefined) {
    if (!url?.startsWith('/uploads/content/')) return;
    const name = url.slice('/uploads/content/'.length);
    if (!name || name.includes('..') || name.includes('/') || name.includes('\\')) {
      return;
    }
    const full = join(this.uploads.contentDir(), name);
    if (existsSync(full)) {
      try {
        unlinkSync(full);
      } catch {
        /* best-effort cleanup */
      }
    }
  }
}
