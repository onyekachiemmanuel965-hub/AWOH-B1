import { BadRequestException } from '@nestjs/common';
import {
  AdminUploadService,
  PRODUCT_IMAGE_MAX_BYTES,
} from './admin-upload.service';
import { existsSync, mkdirSync, rmSync, readFileSync } from 'fs';
import { join } from 'path';

describe('AdminUploadService security', () => {
  const tmp = join(process.cwd(), 'storage', 'uploads-test-stage08');
  const service = new AdminUploadService({
    get: (key: string) => (key === 'UPLOADS_DIR' ? tmp : undefined),
  } as never);

  beforeAll(() => {
    if (!existsSync(tmp)) mkdirSync(tmp, { recursive: true });
  });

  afterAll(() => {
    try {
      rmSync(tmp, { recursive: true, force: true });
    } catch {
      /* ignore */
    }
  });

  it('accepts JPG / PNG / WEBP MIME types', () => {
    expect(
      service.validateImage({
        mimetype: 'image/jpeg',
        originalname: 'a.jpg',
        size: 100,
      }),
    ).toBe('.jpg');
    expect(
      service.validateImage({
        mimetype: 'image/png',
        originalname: 'a.png',
        size: 100,
      }),
    ).toBe('.png');
    expect(
      service.validateImage({
        mimetype: 'image/webp',
        originalname: 'a.webp',
        size: 100,
      }),
    ).toBe('.webp');
  });

  it('rejects unsupported MIME', () => {
    expect(() =>
      service.validateImage({
        mimetype: 'application/pdf',
        originalname: 'a.pdf',
        size: 100,
      }),
    ).toThrow(BadRequestException);
    expect(() =>
      service.validateImage({
        mimetype: 'image/gif',
        originalname: 'a.gif',
        size: 100,
      }),
    ).toThrow(BadRequestException);
  });

  it('rejects unsupported extension even with image MIME spoof attempt', () => {
    expect(() =>
      service.validateImage({
        mimetype: 'image/jpeg',
        originalname: 'evil.exe',
        size: 100,
      }),
    ).toThrow(BadRequestException);
  });

  it('rejects MIME/extension mismatch', () => {
    expect(() =>
      service.validateImage({
        mimetype: 'image/png',
        originalname: 'photo.jpg',
        size: 100,
      }),
    ).toThrow(BadRequestException);
  });

  it('rejects oversized files', () => {
    expect(() =>
      service.validateImage({
        mimetype: 'image/jpeg',
        originalname: 'big.jpg',
        size: PRODUCT_IMAGE_MAX_BYTES + 1,
      }),
    ).toThrow(BadRequestException);
  });

  it('rejects path traversal / unsafe filenames', () => {
    expect(() =>
      service.validateImage({
        mimetype: 'image/jpeg',
        originalname: '../../etc/passwd.jpg',
        size: 10,
      }),
    ).toThrow(BadRequestException);
    expect(() =>
      service.validateImage({
        mimetype: 'image/jpeg',
        originalname: '..\\windows\\system32.jpg',
        size: 10,
      }),
    ).toThrow(BadRequestException);
    expect(() =>
      service.validateImage({
        mimetype: 'image/jpeg',
        originalname: 'foo/bar.jpg',
        size: 10,
      }),
    ).toThrow(BadRequestException);
  });

  it('stores under server-generated name (never user path)', async () => {
    const url = await service.saveProductImage({
      mimetype: 'image/png',
      originalname: 'Customer Upload Name.png',
      size: 4,
      buffer: Buffer.from([1, 2, 3, 4]),
    } as Express.Multer.File);

    expect(url.startsWith('/uploads/products/')).toBe(true);
    expect(url).not.toContain('Customer');
    expect(url).not.toContain('..');
    const fileName = url.split('/').pop()!;
    const full = join(tmp, 'products', fileName);
    expect(existsSync(full)).toBe(true);
    expect(readFileSync(full).length).toBe(4);
  });
});
