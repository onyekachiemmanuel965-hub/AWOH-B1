import { mkdtempSync, readFileSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import {
  DeliveryFeeStatus,
  FulfillmentMethod,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
} from '@prisma/client';
import {
  buildCustomerReceiptData,
  buildReceiptTextLines,
  ReceiptService,
  resolveItemSku,
  type ReceiptOrder,
} from './receipt.service';
import { PaymentsService } from './payments.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';

function money(s: string) {
  return { toString: () => s };
}

function baseOrder(
  overrides: Partial<ReceiptOrder> & {
    items?: ReceiptOrder['items'];
    payments?: ReceiptOrder['payments'];
  } = {},
): ReceiptOrder {
  const {
    items: itemsOverride,
    payments: paymentsOverride,
    ...rest
  } = overrides;
  return {
    id: 'o1',
    orderNumber: 'AWOH-2026-000100',
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
    subtotal: money('10000.00') as never,
    total: money('10000.00') as never,
    currency: 'NGN',
    contactEmail: 'buyer@example.com',
    contactPhone: '+2348012345678',
    shippingLine1: null,
    shippingCity: null,
    shippingLga: null,
    shippingState: null,
    shippingNotes: null,
    shippingStateId: null,
    shippingLgaId: null,
    shippingTownId: null,
    idempotencyKey: null,
    createdAt: new Date('2026-09-20T10:00:00.000Z'),
    updatedAt: new Date('2026-09-20T12:00:00.000Z'),
    items: itemsOverride ?? [
      {
        id: 'i1',
        orderId: 'o1',
        productId: 'p1',
        productName: 'Porcelain Floor Tile',
        productSlug: 'sku-12513',
        productSku: '12513',
        tileSizeLabel: '120 × 60 cm',
        quantity: 2,
        unitPrice: money('5000.00') as never,
        lineTotal: money('10000.00') as never,
      } as never,
    ],
    payments: paymentsOverride ?? [
      {
        id: 'pay1',
        orderId: 'o1',
        method: PaymentMethod.PAYSTACK,
        provider: 'paystack',
        providerReference: 'PSK_REF_ABC123',
        amount: money('10000.00') as never,
        currency: 'NGN',
        status: PaymentStatus.SUCCESS,
        accessCode: null,
        authorizationUrl: null,
        paidAt: new Date('2026-09-20T11:30:00.000Z'),
        metadataJson: null,
        createdAt: new Date('2026-09-20T11:00:00.000Z'),
        updatedAt: new Date('2026-09-20T11:30:00.000Z'),
      } as never,
    ],
    user: {
      firstName: 'Ada',
      lastName: 'Okafor',
      email: 'buyer@example.com',
    },
    ...rest,
  } as ReceiptOrder;
}

const business = {
  name: 'AWOH-B THE GREAT TILES VENTURE',
  address: null,
  phone: null,
  email: null,
  website: null,
  pickupNote: 'Collect from showroom during business hours.',
};

describe('receipt enhancement — customer-safe mapping', () => {
  it('builds complete pickup receipt with one item', () => {
    const data = buildCustomerReceiptData(baseOrder(), business);
    expect(data.business.name).toContain('AWOH-B');
    expect(data.receipt.receiptNumber).toBe('RCPT-AWOH-2026-000100');
    expect(data.receipt.orderNumber).toBe('AWOH-2026-000100');
    expect(data.customer.name).toBe('Ada Okafor');
    expect(data.customer.email).toBe('buyer@example.com');
    expect(data.customer.phone).toBe('+2348012345678');
    expect(data.fulfillment.method).toBe('PICKUP');
    expect(data.deliveryAddress).toBeNull();
    expect(data.items).toHaveLength(1);
    expect(data.items[0].sku).toBe('12513');
    expect(data.items[0].tileSize).toBe('120 × 60 cm');
    expect(data.items[0].unitPrice).toBe('5000.00');
    expect(data.totals.subtotal).toBe('10000.00');
    expect(data.totals.total).toBe('10000.00');
    expect(data.payment.method).toBe('Paystack');
    expect(data.payment.status).toBe('PAID');
    expect(data.payment.reference).toBe('PSK_REF_ABC123');
    expect(data.payment.paidAt).toBe('2026-09-20');
    expect(data.orderStatus).toBe('Payment Confirmed');
  });

  it('builds multi-item receipt with SKU and tile size', () => {
    const order = baseOrder({
      items: [
        {
          id: 'i1',
          orderId: 'o1',
          productId: 'p1',
          productName: 'Tile A',
          productSlug: 'sku-12100',
          productSku: '12100',
          tileSizeLabel: '120 × 60 cm',
          quantity: 1,
          unitPrice: money('5000.00') as never,
          lineTotal: money('5000.00') as never,
        } as never,
        {
          id: 'i2',
          orderId: 'o1',
          productId: 'p2',
          productName: 'Tile B',
          productSlug: 'sku-25100',
          productSku: '25100',
          tileSizeLabel: '25 × 40 cm',
          quantity: 3,
          unitPrice: money('5000.00') as never,
          lineTotal: money('15000.00') as never,
        } as never,
      ],
      subtotal: money('20000.00') as never,
      total: money('20000.00') as never,
    });
    const data = buildCustomerReceiptData(order, business);
    expect(data.items).toHaveLength(2);
    expect(data.items.map((i) => i.sku)).toEqual(['12100', '25100']);
    expect(data.items[1].tileSize).toBe('25 × 40 cm');
  });

  it('includes delivery address snapshot and final delivery fee only', () => {
    const order = baseOrder({
      fulfillmentMethod: FulfillmentMethod.DELIVERY,
      deliveryFeeStatus: DeliveryFeeStatus.FEE_SET_BY_STAFF,
      deliveryFee: money('7500.00') as never,
      subtotal: money('10000.00') as never,
      total: money('17500.00') as never,
      shippingState: 'Anambra',
      shippingLga: 'Awka South',
      shippingCity: 'Amawbia',
      shippingLine1: '12 Market Road, Block B',
      shippingNotes: 'Call on arrival',
      deliveryInternalJson: JSON.stringify({
        totalWeightKg: 147,
        distanceKm: 38,
        ratePerKm: 500,
        weightFactorPerKg: 2,
        negotiationThreshold: 1000,
        surcharge: 50,
        weightPerCartonKg: 32,
      }),
    });
    const data = buildCustomerReceiptData(order, business);
    expect(data.fulfillment.method).toBe('DELIVERY');
    expect(data.deliveryAddress).toEqual({
      state: 'Anambra',
      lga: 'Awka South',
      townCity: 'Amawbia',
      address: '12 Market Road, Block B',
      deliveryInstructions: 'Call on arrival',
    });
    expect(data.totals.deliveryFee).toBe('7500.00');
    expect(data.totals.total).toBe('17500.00');

    const joined = JSON.stringify(data);
    for (const leak of [
      'weightPerCartonKg',
      'totalWeightKg',
      'distanceKm',
      'ratePerKm',
      'weightFactorPerKg',
      'negotiationThreshold',
      'surcharge',
      'deliveryInternalJson',
    ]) {
      expect(joined).not.toContain(leak);
    }
  });

  it('pickup receipt does not include a delivery address block', () => {
    const data = buildCustomerReceiptData(
      baseOrder({
        shippingState: 'Lagos',
        shippingLga: 'Ikeja',
        shippingCity: 'Ikeja',
        shippingLine1: 'should not appear',
      }),
      business,
    );
    expect(data.fulfillment.method).toBe('PICKUP');
    expect(data.deliveryAddress).toBeNull();
  });

  it('uses persisted item unit price, not a catalog recalculation', () => {
    const order = baseOrder({
      items: [
        {
          id: 'i1',
          orderId: 'o1',
          productId: 'p1',
          productName: 'Old Price Tile',
          productSlug: 'sku-99999',
          productSku: '99999',
          tileSizeLabel: '60 × 60 cm',
          quantity: 1,
          unitPrice: money('3200.00') as never,
          lineTotal: money('3200.00') as never,
        } as never,
      ],
      subtotal: money('3200.00') as never,
      total: money('3200.00') as never,
    });
    const data = buildCustomerReceiptData(order, business);
    expect(data.items[0].unitPrice).toBe('3200.00');
    expect(data.items[0].amount).toBe('3200.00');
  });

  it('uses final persisted delivery fee without recalculating', () => {
    const order = baseOrder({
      fulfillmentMethod: FulfillmentMethod.DELIVERY,
      deliveryFee: money('9100.00') as never,
      total: money('19100.00') as never,
      deliveryInternalJson: '{"distanceKm":999,"ratePerKm":1}',
    });
    const data = buildCustomerReceiptData(order, business);
    expect(data.totals.deliveryFee).toBe('9100.00');
  });

  it('unpaid / pending payment is not marked PAID', () => {
    const order = baseOrder({
      status: OrderStatus.AWAITING_OFFLINE_PAYMENT,
      payments: [
        {
          id: 'pay1',
          orderId: 'o1',
          method: PaymentMethod.OFFLINE_CASH,
          provider: 'offline',
          providerReference: null,
          amount: money('10000.00') as never,
          currency: 'NGN',
          status: PaymentStatus.PENDING,
          accessCode: null,
          authorizationUrl: null,
          paidAt: null,
          metadataJson: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        } as never,
      ],
    });
    const data = buildCustomerReceiptData(order, business);
    expect(data.payment.status).toBe('AWAITING PAYMENT');
    expect(data.payment.paidAt).toBeNull();
    expect(data.orderStatus).toBe('Awaiting Offline Payment');
  });

  it('confirmed offline payment shows Cash / Offline and PAID', () => {
    const order = baseOrder({
      payments: [
        {
          id: 'pay1',
          orderId: 'o1',
          method: PaymentMethod.OFFLINE_CASH,
          provider: 'offline',
          providerReference: 'OFF-CONFIRMED-1',
          amount: money('10000.00') as never,
          currency: 'NGN',
          status: PaymentStatus.SUCCESS,
          accessCode: null,
          authorizationUrl: null,
          paidAt: new Date('2026-09-21T09:00:00.000Z'),
          metadataJson: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        } as never,
      ],
    });
    const data = buildCustomerReceiptData(order, business);
    expect(data.payment.method).toBe('Cash / Offline Payment');
    expect(data.payment.status).toBe('PAID');
    expect(data.payment.reference).toBe('OFF-CONFIRMED-1');
    expect(data.payment.paidAt).toBe('2026-09-21');
  });

  it('Paystack success exposes provider reference only', () => {
    const lines = buildReceiptTextLines(baseOrder()).join('\n');
    expect(lines).toContain('PSK_REF_ABC123');
    expect(lines).not.toContain('webhook');
    expect(lines).not.toContain('secret');
  });

  it('resolveItemSku falls back from slug when snapshot missing', () => {
    expect(
      resolveItemSku({ productSku: null, productSlug: 'sku-40300' }),
    ).toBe('40300');
    expect(
      resolveItemSku({ productSku: '  60100  ', productSlug: 'sku-x' }),
    ).toBe('60100');
  });
});

describe('receipt enhancement — PDF generation', () => {
  let dir: string;
  let service: ReceiptService;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'awoh-receipt-'));
    service = new ReceiptService({
      get: (key: string) => {
        if (key === 'RECEIPTS_DIR') return dir;
        if (key === 'BUSINESS_NAME') return 'AWOH-B THE GREAT TILES VENTURE';
        if (key === 'BUSINESS_PICKUP_NOTE')
          return 'Collect from showroom during business hours.';
        return undefined;
      },
    } as never);
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it('writes a non-empty PDF for a single-item order', async () => {
    const path = await service.generatePdf(baseOrder());
    const buf = readFileSync(path);
    expect(buf.length).toBeGreaterThan(500);
    expect(buf.subarray(0, 4).toString()).toBe('%PDF');
  });

  it('writes a multi-page PDF for many long-named items without throwing', async () => {
    const longName =
      'Premium Super Polished Porcelain Floor Tile Collection Variant With Extra Long Marketing Name';
    const items = Array.from({ length: 28 }, (_, i) => ({
      id: `i${i}`,
      orderId: 'o1',
      productId: `p${i}`,
      productName: `${longName} #${i + 1}`,
      productSlug: `sku-12${String(i).padStart(3, '0')}`,
      productSku: `12${String(i).padStart(3, '0')}`,
      tileSizeLabel: '120 × 60 cm',
      quantity: 1 + (i % 3),
      unitPrice: money('5000.00') as never,
      lineTotal: money(String((1 + (i % 3)) * 5000) + '.00') as never,
    })) as never[];

    const path = await service.generatePdf(
      baseOrder({
        items,
        subtotal: money('140000.00') as never,
        total: money('140000.00') as never,
      }),
    );
    const buf = readFileSync(path);
    expect(buf.length).toBeGreaterThan(2000);
    // Multiple page objects typically appear in multi-page PDFs
    const text = buf.toString('latin1');
    expect(text.includes('/Type /Page')).toBe(true);
  });

  it('delivery PDF path still omits internal math in text lines companion', async () => {
    await service.generatePdf(
      baseOrder({
        fulfillmentMethod: FulfillmentMethod.DELIVERY,
        deliveryFee: money('7500.00') as never,
        total: money('17500.00') as never,
        shippingState: 'Anambra',
        shippingLga: 'Awka South',
        shippingCity: 'Awka',
        shippingLine1: '12 Road',
        deliveryInternalJson: JSON.stringify({ distanceKm: 38, ratePerKm: 500 }),
      }),
    );
    const lines = buildReceiptTextLines(
      baseOrder({
        fulfillmentMethod: FulfillmentMethod.DELIVERY,
        deliveryFee: money('7500.00') as never,
        total: money('17500.00') as never,
        shippingState: 'Anambra',
        shippingLga: 'Awka South',
        shippingCity: 'Awka',
        shippingLine1: '12 Road',
        deliveryInternalJson: JSON.stringify({ distanceKm: 38, ratePerKm: 500 }),
      }),
    ).join('\n');
    expect(lines).toContain('State: Anambra');
    expect(lines).toContain('LGA: Awka South');
    expect(lines).toContain('Delivery fee: 7500.00 NGN');
    expect(lines).not.toContain('distanceKm');
    expect(lines).not.toContain('ratePerKm');
  });
});

describe('receipt enhancement — authorization & idempotency', () => {
  it('customer cannot retrieve another customer receipt (owned lookup)', async () => {
    const orders = {
      getOwnedEntity: jest
        .fn()
        .mockRejectedValue(new NotFoundException('Order not found.')),
    };
    const service = new PaymentsService(
      {} as never,
      orders as never,
      { get: () => undefined } as never,
      { name: 'mock' } as never,
      {} as never,
      {} as never,
      { log: jest.fn() } as never,
      { attempt: () => true } as never,
    );
    await expect(
      service.getReceiptForUser('attacker', 'victim-order'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('receipt unavailable until order is PAID with receipt row', async () => {
    const orders = {
      getOwnedEntity: jest.fn().mockResolvedValue({
        id: 'o1',
        userId: 'u1',
        status: OrderStatus.PENDING_PAYMENT,
        receipt: null,
      }),
    };
    const service = new PaymentsService(
      {} as never,
      orders as never,
      { get: () => undefined } as never,
      { name: 'mock' } as never,
      {} as never,
      {} as never,
      { log: jest.fn() } as never,
      { attempt: () => true } as never,
    );
    await expect(service.getReceiptForUser('u1', 'o1')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('does not create a second receipt when one already exists', async () => {
    const existingReceipt = { id: 'r1', orderId: 'o1', storagePath: '/r.pdf' };
    const paidPayment = {
      id: 'p1',
      status: PaymentStatus.SUCCESS,
      method: PaymentMethod.OFFLINE_CASH,
      amount: money('1000.00'),
      createdAt: new Date(),
      paidAt: new Date(),
    };
    const orderWithReceipt = {
      id: 'o1',
      userId: 'u1',
      orderNumber: 'AWOH-1',
      status: OrderStatus.PAID,
      fulfillmentMethod: FulfillmentMethod.PICKUP,
      deliveryFeeStatus: DeliveryFeeStatus.NOT_REQUIRED,
      deliveryFee: money('0.00'),
      deliveryQuoteExpiresAt: null,
      subtotal: money('1000.00'),
      total: money('1000.00'),
      currency: 'NGN',
      contactEmail: 'a@b.com',
      contactPhone: null,
      shippingLine1: null,
      shippingCity: null,
      shippingState: null,
      shippingNotes: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      payments: [paidPayment],
      items: [],
      receipt: existingReceipt,
    };
    const receipts = {
      generatePdf: jest.fn(),
      sendEmailReceipt: jest.fn(),
    };
    const prisma = {
      order: {
        findUnique: jest.fn().mockResolvedValue(orderWithReceipt),
        findUniqueOrThrow: jest.fn().mockResolvedValue(orderWithReceipt),
      },
      payment: { findUnique: jest.fn(), update: jest.fn() },
      receipt: { create: jest.fn() },
      $transaction: jest.fn(),
    };
    const service = new PaymentsService(
      prisma as never,
      { assertPayable: jest.fn() } as never,
      { get: () => 'NGN' } as never,
      { name: 'mock' } as never,
      {} as never,
      receipts as never,
      { log: jest.fn() } as never,
      { attempt: () => true } as never,
    );
    const result = await service.confirmOfflinePayment('staff', 'o1');
    expect(result.alreadyProcessed).toBe(true);
    expect(receipts.generatePdf).not.toHaveBeenCalled();
    expect(prisma.receipt.create).not.toHaveBeenCalled();
  });
});
