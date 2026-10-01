import {
  BadRequestException,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createWriteStream, existsSync, mkdirSync, writeFileSync } from 'fs';
import { basename, extname, join } from 'path';
import { randomBytes } from 'crypto';
import { pipeline } from 'stream/promises';
import type { Readable } from 'stream';

const ALLOWED_MIME: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

const ALLOWED_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp']);

export const PRODUCT_IMAGE_MAX_BYTES = 5 * 1024 * 1024; // 5MB

@Injectable()
export class AdminUploadService {
  constructor(private readonly config: ConfigService) {}

  uploadsRoot() {
    const dir =
      this.config.get<string>('UPLOADS_DIR') ||
      join(process.cwd(), 'storage', 'uploads');
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    return dir;
  }

  productsDir() {
    const dir = join(this.uploadsRoot(), 'products');
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    return dir;
  }

  contentDir() {
    const dir = join(this.uploadsRoot(), 'content');
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    return dir;
  }

  /**
   * MIME + extension validation. Never trusts path components in originalname.
   * Returns the safe extension to use for storage (not user filename).
   */
  validateImage(file: {
    mimetype?: string;
    originalname?: string;
    size?: number;
  }) {
    if (!file?.mimetype || !ALLOWED_MIME[file.mimetype]) {
      throw new BadRequestException(
        'Invalid image type. Allowed: JPG, PNG, WEBP.',
      );
    }

    const rawName = file.originalname || '';
    // Reject path traversal / absolute paths in the client-provided name
    if (
      rawName.includes('..') ||
      rawName.includes('/') ||
      rawName.includes('\\') ||
      rawName.includes('\0')
    ) {
      throw new BadRequestException('Unsafe filename rejected.');
    }

    const base = basename(rawName);
    const ext = extname(base).toLowerCase();
    const expected = ALLOWED_MIME[file.mimetype];

    if (ext && !ALLOWED_EXT.has(ext)) {
      throw new BadRequestException('Invalid image file extension.');
    }
    // Extension must align with MIME when both present (jpeg↔jpg allowed)
    if (ext) {
      const normalized = ext === '.jpeg' ? '.jpg' : ext;
      if (normalized !== expected) {
        throw new BadRequestException(
          'Image extension does not match declared type.',
        );
      }
    }

    if ((file.size ?? 0) > PRODUCT_IMAGE_MAX_BYTES) {
      throw new BadRequestException('Image exceeds 5MB limit.');
    }
    if ((file.size ?? 0) <= 0 && !('buffer' in file)) {
      // size may be 0 for empty; saveProductImage checks buffer
    }
    return expected;
  }

  /** Always generates a server-controlled filename — never uses user path. */
  async saveProductImage(file: Express.Multer.File): Promise<string> {
    return this.saveImageUnder(file, 'products', this.productsDir());
  }

  /** Storefront / page CMS imagery — same validation rules as product images. */
  async saveContentImage(file: Express.Multer.File): Promise<string> {
    return this.saveImageUnder(file, 'content', this.contentDir());
  }

  private async saveImageUnder(
    file: Express.Multer.File,
    publicSubdir: 'products' | 'content',
    root: string,
  ): Promise<string> {
    if (!file) {
      throw new BadRequestException('Empty upload.');
    }
    const ext = this.validateImage(file);
    const name = `${Date.now().toString(36)}_${randomBytes(8).toString('hex')}${ext}`;
    const full = join(root, name);

    if (!full.startsWith(root)) {
      throw new BadRequestException('Unsafe storage path rejected.');
    }

    if (file.buffer) {
      writeFileSync(full, file.buffer);
    } else if (file.stream) {
      await pipeline(file.stream as Readable, createWriteStream(full));
    } else {
      throw new BadRequestException('Empty upload.');
    }
    return `/uploads/${publicSubdir}/${name}`;
  }
}
