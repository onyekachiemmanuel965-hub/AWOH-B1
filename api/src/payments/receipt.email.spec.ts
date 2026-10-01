import { mkdtempSync, writeFileSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import {
  DeliveryFeeStatus,
  FulfillmentMethod,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
} from '@prisma/client';
import { ReceiptService, type ReceiptOrder } from './receipt.service';

function money(s: string) {
  return { toString: () => s };
}

function paidOrder(): ReceiptOrder {
  return {
    id: 'o1',
    orderNumber: 'AWOH-2026-000200',
    userId: 'u1',
    status: OrderStatus.PAID,
    fulfillmentMethod: FulfillmentMethod.PICKUP,
    deliveryFeeStatus: DeliveryFeeStatus.NOT_REQUIRED,
    deliveryFee: money('0.00') as never,
    deliveryQuoteExpiresAt: null,
    deliveryQuoteVersion: 0,
    deliveryQuoteConfirmedVersion: null,
    deliveryQuoteConfirmedAt: null,
    deliveryInternalJson: null,
    deliveryConfigId: null,
    subtotal: money('5000.00') as never,
    total: money('5000.00') as never,
    currency: 'NGN',
    contactEmail: 'customer@example.com',
    contactPhone: null,
    shippingLine1: null,
    shippingCity: null,
    shippingLga: null,
    shippingState: null,
    shippingNotes: null,
    shippingStateId: null,
    shippingLgaId: null,
    shippingTownId: null,
    idempotencyKey: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    items: [
      {
        id: 'i1',
        orderId: 'o1',
        productId: 'p1',
        productName: 'Tile',
        productSlug: 'sku-12513',
        productSku: '12513',
        tileSizeLabel: '120 × 60 cm',
        quantity: 1,
        unitPrice: money('5000.00') as never,
        lineTotal: money('5000.00') as never,
      } as never,
    ],
    payments: [
      {
        id: 'pay1',
        orderId: 'o1',
        method: PaymentMethod.PAYSTACK,
        provider: 'paystack',
        providerReference: 'ref_email',
        amount: money('5000.00') as never,
        currency: 'NGN',
        status: PaymentStatus.SUCCESS,
        accessCode: null,
        authorizationUrl: null,
        paidAt: new Date(),
        metadataJson: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as never,
    ],
    user: { firstName: 'Ada', lastName: 'Okafor', email: 'customer@example.com' },
  } as ReceiptOrder;
}

describe('receipt email PDF delivery', () => {
  let dir: string;
  let pdfPath: string;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'awoh-email-'));
    pdfPath = join(dir, 'receipt.pdf');
    writeFileSync(pdfPath, '%PDF-1.4 mock');
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it('console mode logs immediate PDF email without throwing', async () => {
    const service = new ReceiptService({
      get: (key: string) => {
        if (key === 'EMAIL_MODE') return 'console';
        if (key === 'BUSINESS_NAME') return 'AWOH-B THE GREAT TILES VENTURE';
        return undefined;
      },
    } as never);
    const result = await service.sendEmailReceipt(paidOrder(), pdfPath);
    expect(result.status).toBe('LOGGED');
  });

  it('smtp mode without host returns PENDING_CONFIG', async () => {
    const service = new ReceiptService({
      get: (key: string) => {
        if (key === 'EMAIL_MODE') return 'smtp';
        return undefined;
      },
    } as never);
    const result = await service.sendEmailReceipt(paidOrder(), pdfPath);
    expect(result.status).toBe('PENDING_CONFIG');
  });

  it('missing contact email is skipped', async () => {
    const service = new ReceiptService({
      get: (key: string) => (key === 'EMAIL_MODE' ? 'console' : undefined),
    } as never);
    const order = paidOrder();
    order.contactEmail = '';
    const result = await service.sendEmailReceipt(order, pdfPath);
    expect(result.status).toBe('SKIPPED_NO_EMAIL');
  });
});
