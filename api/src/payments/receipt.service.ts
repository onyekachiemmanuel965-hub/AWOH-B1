import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createWriteStream, existsSync, mkdirSync, readFileSync } from 'fs';
import { join } from 'path';
import * as nodemailer from 'nodemailer';
import PDFDocument = require('pdfkit');
import {
  FulfillmentMethod,
  Order,
  OrderItem,
  OrderStatus,
  Payment,
  PaymentMethod,
  PaymentStatus,
  User,
} from '@prisma/client';

export type ReceiptOrder = Order & {
  items: OrderItem[];
  payments: Payment[];
  user?: Pick<User, 'firstName' | 'lastName' | 'email'> | null;
};

/** Deliberate customer-safe receipt view — never includes internal delivery math. */
export type CustomerReceiptData = {
  business: {
    name: string;
    address: string | null;
    phone: string | null;
    email: string | null;
    website: string | null;
    pickupNote: string | null;
  };
  receipt: {
    receiptNumber: string;
    orderNumber: string;
    receiptDate: string;
    receiptTime: string;
  };
  customer: {
    name: string;
    email: string;
    phone: string | null;
  };
  fulfillment: {
    method: 'DELIVERY' | 'PICKUP';
    label: string;
  };
  deliveryAddress: {
    state: string | null;
    lga: string | null;
    townCity: string | null;
    address: string | null;
    deliveryInstructions: string | null;
  } | null;
  items: Array<{
    product: string;
    sku: string;
    tileSize: string;
    quantity: number;
    unitPrice: string;
    amount: string;
  }>;
  totals: {
    subtotal: string;
    deliveryFee: string | null;
    total: string;
    currency: string;
  };
  payment: {
    method: string;
    status: string;
    reference: string | null;
    paidAt: string | null;
  };
  orderStatus: string;
};

const NAVY = '#0B1C2C';
const GOLD = '#C6A75E';
const GRAPHITE = '#2C333A';
const MUTED = '#5C6570';
const IVORY = '#F7F3EB';

function moneyLabel(amount: string, currency: string): string {
  const n = Number(amount);
  const formatted = Number.isFinite(n)
    ? n.toLocaleString('en-NG', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    : amount;
  return currency === 'NGN' ? `₦${formatted}` : `${formatted} ${currency}`;
}

function formatDateParts(d: Date) {
  return {
    date: d.toISOString().slice(0, 10),
    time: d.toISOString().slice(11, 19) + ' UTC',
  };
}

function paymentMethodLabel(method: PaymentMethod): string {
  switch (method) {
    case PaymentMethod.PAYSTACK:
      return 'Paystack';
    case PaymentMethod.OFFLINE_CASH:
      return 'Cash / Offline Payment';
    default:
      return String(method);
  }
}

function paymentStatusLabel(status: PaymentStatus): string {
  switch (status) {
    case PaymentStatus.SUCCESS:
      return 'PAID';
    case PaymentStatus.PENDING:
      return 'AWAITING PAYMENT';
    case PaymentStatus.PROCESSING:
      return 'PROCESSING';
    case PaymentStatus.FAILED:
      return 'FAILED';
    case PaymentStatus.CANCELLED:
      return 'CANCELLED';
    case PaymentStatus.REFUNDED:
      return 'REFUNDED';
    default:
      return String(status);
  }
}

function orderStatusLabel(status: OrderStatus): string {
  switch (status) {
    case OrderStatus.PAID:
      return 'Payment Confirmed';
    case OrderStatus.PENDING_PAYMENT:
      return 'Awaiting Payment';
    case OrderStatus.AWAITING_OFFLINE_PAYMENT:
      return 'Awaiting Offline Payment';
    case OrderStatus.AWAITING_DELIVERY_CONFIRMATION:
      return 'Awaiting Delivery Quote Confirmation';
    case OrderStatus.PAYMENT_FAILED:
      return 'Payment Failed';
    case OrderStatus.CANCELLED:
      return 'Cancelled';
    default:
      return String(status);
  }
}

/** Derive customer-visible SKU from snapshot or persisted slug (e.g. sku-12513). */
export function resolveItemSku(item: {
  productSku?: string | null;
  productSlug: string;
}): string {
  if (item.productSku?.trim()) return item.productSku.trim();
  const m = /^sku-(.+)$/i.exec(item.productSlug.trim());
  if (m) return m[1].toUpperCase();
  return item.productSlug;
}

/**
 * Build customer-safe receipt data from authoritative order/payment snapshots.
 * Never reads deliveryInternalJson / weights / rates into the document model.
 */
export function buildCustomerReceiptData(
  order: ReceiptOrder,
  business: CustomerReceiptData['business'],
): CustomerReceiptData {
  const generatedAt = new Date();
  const successPayment = [...order.payments]
    .filter((p) => p.status === PaymentStatus.SUCCESS)
    .sort(
      (a, b) =>
        (b.paidAt?.getTime() ?? b.createdAt.getTime()) -
        (a.paidAt?.getTime() ?? a.createdAt.getTime()),
    )[0];
  const latestPayment = [...order.payments].sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
  )[0];
  const payment = successPayment ?? latestPayment;

  const customerName = order.user
    ? `${order.user.firstName} ${order.user.lastName}`.trim()
    : order.contactEmail;

  const isDelivery = order.fulfillmentMethod === FulfillmentMethod.DELIVERY;

  // Prefer authoritative payment timestamp when paid; else generation clock.
  const receiptInstant =
    successPayment?.paidAt ??
    successPayment?.updatedAt ??
    generatedAt;
  const receiptParts = formatDateParts(receiptInstant);

  return {
    business,
    receipt: {
      receiptNumber: `RCPT-${order.orderNumber}`,
      orderNumber: order.orderNumber,
      receiptDate: receiptParts.date,
      receiptTime: receiptParts.time,
    },
    customer: {
      name: customerName || order.contactEmail,
      email: order.contactEmail,
      phone: order.contactPhone,
    },
    fulfillment: {
      method: isDelivery ? 'DELIVERY' : 'PICKUP',
      label: isDelivery ? 'Delivery' : 'Pickup',
    },
    deliveryAddress: isDelivery
      ? {
          state: order.shippingState,
          lga: order.shippingLga ?? null,
          townCity: order.shippingCity,
          address: order.shippingLine1,
          deliveryInstructions: order.shippingNotes,
        }
      : null,
    items: order.items.map((item) => ({
      product: item.productName,
      sku: resolveItemSku(item),
      tileSize: item.tileSizeLabel?.trim() || '—',
      quantity: item.quantity,
      unitPrice: item.unitPrice.toString(),
      amount: item.lineTotal.toString(),
    })),
    totals: {
      subtotal: order.subtotal.toString(),
      deliveryFee:
        isDelivery && order.deliveryFee != null
          ? order.deliveryFee.toString()
          : isDelivery
            ? null
            : '0.00',
      total: order.total.toString(),
      currency: order.currency,
    },
    payment: payment
      ? {
          method: paymentMethodLabel(payment.method),
          status: paymentStatusLabel(payment.status),
          reference: payment.providerReference,
          paidAt: payment.paidAt
            ? formatDateParts(payment.paidAt).date
            : null,
        }
      : {
          method: '—',
          status: 'AWAITING PAYMENT',
          reference: null,
          paidAt: null,
        },
    orderStatus: orderStatusLabel(order.status),
  };
}

/** Flat text lines for privacy tests / email logging — derived from safe DTO only. */
export function buildReceiptTextLines(order: ReceiptOrder): string[] {
  const data = buildCustomerReceiptData(order, {
    name: 'AWOH-B THE GREAT TILES VENTURE',
    address: null,
    phone: null,
    email: null,
    website: null,
    pickupNote: null,
  });
  const lines: string[] = [
    data.business.name,
    'Payment Receipt',
    `Receipt number: ${data.receipt.receiptNumber}`,
    `Order number: ${data.receipt.orderNumber}`,
    `Date: ${data.receipt.receiptDate}`,
    `Fulfillment: ${data.fulfillment.label}`,
    `Customer: ${data.customer.name}`,
    `Email: ${data.customer.email}`,
  ];
  if (data.customer.phone) lines.push(`Phone: ${data.customer.phone}`);
  if (data.deliveryAddress) {
    lines.push('Delivery address:');
    if (data.deliveryAddress.state)
      lines.push(`State: ${data.deliveryAddress.state}`);
    if (data.deliveryAddress.lga) lines.push(`LGA: ${data.deliveryAddress.lga}`);
    if (data.deliveryAddress.townCity)
      lines.push(`Town/City: ${data.deliveryAddress.townCity}`);
    if (data.deliveryAddress.address)
      lines.push(`Address: ${data.deliveryAddress.address}`);
    if (data.deliveryAddress.deliveryInstructions)
      lines.push(
        `Instructions: ${data.deliveryAddress.deliveryInstructions}`,
      );
  }
  for (const item of data.items) {
    lines.push(
      `${item.product} | SKU ${item.sku} | ${item.tileSize} | × ${item.quantity} @ ${item.unitPrice} = ${item.amount} ${data.totals.currency}`,
    );
  }
  lines.push(
    `Subtotal: ${data.totals.subtotal} ${data.totals.currency}`,
  );
  if (data.totals.deliveryFee != null) {
    lines.push(
      `Delivery fee: ${data.totals.deliveryFee} ${data.totals.currency}`,
    );
  }
  lines.push(`Total: ${data.totals.total} ${data.totals.currency}`);
  lines.push(`Payment method: ${data.payment.method}`);
  lines.push(`Payment status: ${data.payment.status}`);
  if (data.payment.reference) {
    lines.push(`Reference: ${data.payment.reference}`);
  }
  if (data.payment.paidAt) {
    lines.push(`Payment date: ${data.payment.paidAt}`);
  }
  lines.push(`Order status: ${data.orderStatus}`);
  return lines;
}

@Injectable()
export class ReceiptService {
  private readonly logger = new Logger(ReceiptService.name);

  constructor(private readonly config: ConfigService) {}

  private receiptsDir() {
    const dir =
      this.config.get<string>('RECEIPTS_DIR') ||
      join(process.cwd(), 'storage', 'receipts');
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    return dir;
  }

  private businessConfig(): CustomerReceiptData['business'] {
    const blank = (v?: string | null) => {
      const t = v?.trim();
      return t ? t : null;
    };
    return {
      name:
        blank(this.config.get<string>('BUSINESS_NAME')) ||
        'AWOH-B THE GREAT TILES VENTURE',
      address: blank(this.config.get<string>('BUSINESS_ADDRESS')),
      phone: blank(this.config.get<string>('BUSINESS_PHONE')),
      email: blank(this.config.get<string>('BUSINESS_EMAIL')),
      website: blank(this.config.get<string>('BUSINESS_WEBSITE')),
      pickupNote: blank(this.config.get<string>('BUSINESS_PICKUP_NOTE')),
    };
  }

  private logoPath(): string | null {
    const configured = this.config.get<string>('BUSINESS_LOGO_PATH')?.trim();
    if (configured && existsSync(configured)) return configured;
    const candidates = [
      join(process.cwd(), 'assets', 'brand', 'logo.png'),
      join(process.cwd(), 'assets', 'brand', 'icon.png'),
    ];
    return candidates.find((p) => existsSync(p)) ?? null;
  }

  async generatePdf(order: ReceiptOrder): Promise<string> {
    const fileName = `${order.orderNumber}.pdf`;
    const fullPath = join(this.receiptsDir(), fileName);
    const data = buildCustomerReceiptData(order, this.businessConfig());
    const logo = this.logoPath();

    await new Promise<void>((resolve, reject) => {
      const doc = new PDFDocument({
        margin: 48,
        size: 'A4',
        info: {
          Title: `Receipt ${data.receipt.receiptNumber}`,
          Author: data.business.name,
        },
      });
      const stream = createWriteStream(fullPath);
      doc.pipe(stream);

      const pageWidth =
        doc.page.width - doc.page.margins.left - doc.page.margins.right;
      let y = doc.page.margins.top;

      const ensureSpace = (needed: number) => {
        const bottom = doc.page.height - doc.page.margins.bottom;
        if (y + needed > bottom) {
          doc.addPage();
          y = doc.page.margins.top;
        }
      };

      // Header band
      doc.save();
      doc.rect(0, 0, doc.page.width, 8).fill(NAVY);
      doc.restore();

      if (logo) {
        try {
          doc.image(logo, doc.page.margins.left, y, {
            fit: [72, 72],
          });
        } catch {
          /* ignore corrupt logo; text branding remains */
        }
      }

      const headerX = doc.page.margins.left + (logo ? 88 : 0);
      doc
        .fillColor(NAVY)
        .font('Helvetica-Bold')
        .fontSize(16)
        .text(data.business.name, headerX, y, {
          width: pageWidth - (logo ? 88 : 0),
        });
      y += 22;
      doc.fillColor(MUTED).font('Helvetica').fontSize(9);
      const contactBits = [
        data.business.address,
        data.business.phone ? `Tel: ${data.business.phone}` : null,
        data.business.email,
        data.business.website,
      ].filter(Boolean) as string[];
      for (const line of contactBits) {
        doc.text(line, headerX, y, { width: pageWidth - (logo ? 88 : 0) });
        y += 12;
      }
      y = Math.max(y, doc.page.margins.top + (logo ? 78 : 40)) + 8;

      doc
        .moveTo(doc.page.margins.left, y)
        .lineTo(doc.page.margins.left + pageWidth, y)
        .strokeColor(GOLD)
        .lineWidth(1.25)
        .stroke();
      y += 14;

      doc
        .fillColor(NAVY)
        .font('Helvetica-Bold')
        .fontSize(14)
        .text('RECEIPT', doc.page.margins.left, y);
      y += 18;
      doc.fillColor(GRAPHITE).font('Helvetica').fontSize(10);
      const meta = [
        `Receipt No: ${data.receipt.receiptNumber}`,
        `Order No: ${data.receipt.orderNumber}`,
        `Date: ${data.receipt.receiptDate}`,
        `Time: ${data.receipt.receiptTime}`,
        `Order status: ${data.orderStatus}`,
      ];
      for (const line of meta) {
        doc.text(line, doc.page.margins.left, y);
        y += 13;
      }
      y += 8;

      // Customer
      ensureSpace(70);
      doc
        .fillColor(NAVY)
        .font('Helvetica-Bold')
        .fontSize(11)
        .text('CUSTOMER', doc.page.margins.left, y);
      y += 15;
      doc.fillColor(GRAPHITE).font('Helvetica').fontSize(10);
      doc.text(`Name: ${data.customer.name}`, doc.page.margins.left, y);
      y += 13;
      doc.text(`Email: ${data.customer.email}`, doc.page.margins.left, y);
      y += 13;
      if (data.customer.phone) {
        doc.text(`Phone: ${data.customer.phone}`, doc.page.margins.left, y);
        y += 13;
      }
      y += 6;

      // Fulfillment
      ensureSpace(40);
      doc
        .fillColor(NAVY)
        .font('Helvetica-Bold')
        .fontSize(11)
        .text('FULFILLMENT', doc.page.margins.left, y);
      y += 15;
      doc
        .fillColor(GRAPHITE)
        .font('Helvetica')
        .fontSize(10)
        .text(data.fulfillment.label, doc.page.margins.left, y);
      y += 14;

      if (data.fulfillment.method === 'PICKUP' && data.business.pickupNote) {
        doc
          .fillColor(MUTED)
          .text(data.business.pickupNote, doc.page.margins.left, y, {
            width: pageWidth,
          });
        y = doc.y + 8;
      }

      if (data.deliveryAddress) {
        ensureSpace(90);
        doc
          .fillColor(NAVY)
          .font('Helvetica-Bold')
          .fontSize(11)
          .text('DELIVERY ADDRESS', doc.page.margins.left, y);
        y += 15;
        doc.fillColor(GRAPHITE).font('Helvetica').fontSize(10);
        const addrLines = [
          data.deliveryAddress.state
            ? `State: ${data.deliveryAddress.state}`
            : null,
          data.deliveryAddress.lga ? `LGA: ${data.deliveryAddress.lga}` : null,
          data.deliveryAddress.townCity
            ? `Town/City: ${data.deliveryAddress.townCity}`
            : null,
          data.deliveryAddress.address
            ? `Address: ${data.deliveryAddress.address}`
            : null,
          data.deliveryAddress.deliveryInstructions
            ? `Instructions: ${data.deliveryAddress.deliveryInstructions}`
            : null,
        ].filter(Boolean) as string[];
        for (const line of addrLines) {
          ensureSpace(16);
          doc.text(line, doc.page.margins.left, y, { width: pageWidth });
          y = doc.y + 2;
        }
        y += 6;
      }

      // Items table
      ensureSpace(40);
      doc
        .fillColor(NAVY)
        .font('Helvetica-Bold')
        .fontSize(11)
        .text('ORDER ITEMS', doc.page.margins.left, y);
      y += 14;

      const cols = {
        product: { x: doc.page.margins.left, w: 150 },
        sku: { x: doc.page.margins.left + 150, w: 70 },
        size: { x: doc.page.margins.left + 220, w: 70 },
        qty: { x: doc.page.margins.left + 290, w: 36 },
        unit: { x: doc.page.margins.left + 326, w: 90 },
        amount: { x: doc.page.margins.left + 416, w: pageWidth - 416 },
      };

      const drawTableHeader = () => {
        doc.save();
        doc
          .rect(doc.page.margins.left, y, pageWidth, 18)
          .fill(IVORY);
        doc.restore();
        doc.fillColor(NAVY).font('Helvetica-Bold').fontSize(8);
        const hy = y + 5;
        doc.text('Product', cols.product.x + 2, hy, { width: cols.product.w - 4 });
        doc.text('SKU', cols.sku.x, hy, { width: cols.sku.w });
        doc.text('Size', cols.size.x, hy, { width: cols.size.w });
        doc.text('Qty', cols.qty.x, hy, { width: cols.qty.w, align: 'right' });
        doc.text('Unit Price', cols.unit.x, hy, {
          width: cols.unit.w,
          align: 'right',
        });
        doc.text('Amount', cols.amount.x, hy, {
          width: cols.amount.w,
          align: 'right',
        });
        y += 22;
      };

      drawTableHeader();

      for (const item of data.items) {
        doc.font('Helvetica').fontSize(8).fillColor(GRAPHITE);
        const productH = doc.heightOfString(item.product, {
          width: cols.product.w - 4,
        });
        const rowH = Math.max(16, productH + 4);
        ensureSpace(rowH + 8);
        if (y === doc.page.margins.top) drawTableHeader();

        const rowY = y;
        doc.text(item.product, cols.product.x + 2, rowY, {
          width: cols.product.w - 4,
        });
        doc.text(item.sku, cols.sku.x, rowY, { width: cols.sku.w });
        doc.text(item.tileSize, cols.size.x, rowY, { width: cols.size.w });
        doc.text(String(item.quantity), cols.qty.x, rowY, {
          width: cols.qty.w,
          align: 'right',
        });
        doc.text(
          moneyLabel(item.unitPrice, data.totals.currency),
          cols.unit.x,
          rowY,
          { width: cols.unit.w, align: 'right' },
        );
        doc.text(
          moneyLabel(item.amount, data.totals.currency),
          cols.amount.x,
          rowY,
          { width: cols.amount.w, align: 'right' },
        );
        y += rowH + 4;
      }

      y += 6;
      doc
        .moveTo(doc.page.margins.left, y)
        .lineTo(doc.page.margins.left + pageWidth, y)
        .strokeColor('#D6D0C4')
        .lineWidth(0.75)
        .stroke();
      y += 12;

      // Totals
      ensureSpace(70);
      const totalsX = doc.page.margins.left + pageWidth - 220;
      doc.font('Helvetica').fontSize(10).fillColor(GRAPHITE);
      doc.text('Subtotal', totalsX, y, { width: 100 });
      doc.text(
        moneyLabel(data.totals.subtotal, data.totals.currency),
        totalsX + 100,
        y,
        { width: 120, align: 'right' },
      );
      y += 14;
      if (data.fulfillment.method === 'DELIVERY') {
        doc.text('Delivery', totalsX, y, { width: 100 });
        doc.text(
          data.totals.deliveryFee != null
            ? moneyLabel(data.totals.deliveryFee, data.totals.currency)
            : '—',
          totalsX + 100,
          y,
          { width: 120, align: 'right' },
        );
        y += 14;
      }
      doc
        .moveTo(totalsX, y)
        .lineTo(totalsX + 220, y)
        .strokeColor(GOLD)
        .lineWidth(1)
        .stroke();
      y += 8;
      doc.font('Helvetica-Bold').fontSize(12).fillColor(NAVY);
      doc.text('TOTAL', totalsX, y, { width: 100 });
      doc.text(
        moneyLabel(data.totals.total, data.totals.currency),
        totalsX + 100,
        y,
        { width: 120, align: 'right' },
      );
      y += 24;

      // Payment
      ensureSpace(80);
      doc
        .fillColor(NAVY)
        .font('Helvetica-Bold')
        .fontSize(11)
        .text('PAYMENT', doc.page.margins.left, y);
      y += 15;
      doc.fillColor(GRAPHITE).font('Helvetica').fontSize(10);
      doc.text(`Method: ${data.payment.method}`, doc.page.margins.left, y);
      y += 13;
      doc.text(`Status: ${data.payment.status}`, doc.page.margins.left, y);
      y += 13;
      if (data.payment.reference) {
        doc.text(
          `Transaction Reference: ${data.payment.reference}`,
          doc.page.margins.left,
          y,
          { width: pageWidth },
        );
        y = doc.y + 4;
      }
      if (data.payment.paidAt) {
        doc.text(
          `Payment Date: ${data.payment.paidAt}`,
          doc.page.margins.left,
          y,
        );
        y += 13;
      }
      y += 16;

      // Footer
      ensureSpace(70);
      doc
        .moveTo(doc.page.margins.left, y)
        .lineTo(doc.page.margins.left + pageWidth, y)
        .strokeColor(GOLD)
        .lineWidth(1)
        .stroke();
      y += 14;
      doc
        .fillColor(NAVY)
        .font('Helvetica-Bold')
        .fontSize(10)
        .text(
          `Thank you for choosing ${data.business.name}.`,
          doc.page.margins.left,
          y,
          { width: pageWidth, align: 'center' },
        );
      y += 14;
      doc
        .fillColor(MUTED)
        .font('Helvetica')
        .fontSize(9)
        .text(
          'For questions about your order, please contact our sales team.',
          doc.page.margins.left,
          y,
          { width: pageWidth, align: 'center' },
        );
      y += 12;
      const footerContact = [
        data.business.phone,
        data.business.email,
        data.business.website,
      ]
        .filter(Boolean)
        .join('  ·  ');
      if (footerContact) {
        doc.text(footerContact, doc.page.margins.left, y, {
          width: pageWidth,
          align: 'center',
        });
      }

      doc.end();
      stream.on('finish', () => resolve());
      stream.on('error', reject);
    });

    return fullPath;
  }

  async sendEmailReceipt(order: ReceiptOrder, pdfPath: string) {
    const mode = (this.config.get<string>('EMAIL_MODE') || 'console')
      .trim()
      .toLowerCase();
    const preview = buildCustomerReceiptData(order, this.businessConfig());
    const to = order.contactEmail?.trim().toLowerCase();
    if (!to) {
      this.logger.warn(
        `Receipt ${preview.receipt.receiptNumber}: no contact email; skipping send.`,
      );
      return { status: 'SKIPPED_NO_EMAIL' as const };
    }
    if (!existsSync(pdfPath)) {
      this.logger.error(
        `Receipt PDF missing at ${pdfPath}; cannot email ${to}.`,
      );
      return { status: 'FAILED' as const };
    }

    const subject = `Your AWOH-B receipt ${preview.receipt.receiptNumber}`;
    const text = [
      `Thank you for your order with ${preview.business.name}.`,
      '',
      `Receipt number: ${preview.receipt.receiptNumber}`,
      `Order number: ${preview.receipt.orderNumber}`,
      `Total: ${moneyLabel(preview.totals.total, preview.totals.currency)}`,
      `Payment status: ${preview.payment.status}`,
      '',
      'Your official receipt is attached as a PDF.',
      '',
      'For questions about your order, please contact our sales team.',
      preview.business.email ? `Email: ${preview.business.email}` : null,
      preview.business.phone ? `Phone: ${preview.business.phone}` : null,
    ]
      .filter(Boolean)
      .join('\n');

    const filename = `AWOH-B-Receipt-${preview.receipt.orderNumber}.pdf`;
    const pdfBytes = readFileSync(pdfPath);

    if (mode === 'console') {
      this.logger.log(
        `[email:console] Sending receipt PDF immediately → ${to} | ${filename} (${pdfBytes.length} bytes) | ${pdfPath}`,
      );
      this.logger.log(`[email:console] Subject: ${subject}`);
      return { status: 'LOGGED' as const };
    }

    if (mode === 'smtp') {
      const host = this.config.get<string>('EMAIL_SMTP_HOST')?.trim();
      const port = Number(this.config.get<string>('EMAIL_SMTP_PORT') || '587');
      const user = this.config.get<string>('EMAIL_SMTP_USER')?.trim();
      const pass = this.config.get<string>('EMAIL_SMTP_PASS')?.trim();
      const from =
        this.config.get<string>('EMAIL_FROM')?.trim() ||
        preview.business.email ||
        user ||
        'noreply@awoh-b.local';

      if (!host) {
        this.logger.warn(
          'EMAIL_MODE=smtp but EMAIL_SMTP_HOST is missing; receipt not emailed.',
        );
        return { status: 'PENDING_CONFIG' as const };
      }

      try {
        const transporter = nodemailer.createTransport({
          host,
          port: Number.isFinite(port) ? port : 587,
          secure:
            (this.config.get<string>('EMAIL_SMTP_SECURE') || '')
              .toLowerCase() === 'true' || port === 465,
          auth: user && pass ? { user, pass } : undefined,
        });

        await transporter.sendMail({
          from,
          to,
          subject,
          text,
          attachments: [
            {
              filename,
              content: pdfBytes,
              contentType: 'application/pdf',
            },
          ],
        });

        this.logger.log(
          `Receipt PDF emailed to ${to} for order ${order.orderNumber}.`,
        );
        return { status: 'SENT' as const };
      } catch (err) {
        this.logger.error(
          `Failed to email receipt PDF to ${to}: ${
            err instanceof Error ? err.message : String(err)
          }`,
        );
        // Payment remains successful — email failure is recorded, not fatal.
        return { status: 'FAILED' as const };
      }
    }

    this.logger.warn(
      `EMAIL_MODE=${mode} is not supported (use console|smtp); receipt logged only.`,
    );
    return { status: 'PENDING_CONFIG' as const };
  }

  resolvePath(storagePath: string) {
    return storagePath;
  }

  /** Test helper — proves logo bytes are readable when present. */
  logoBytesAvailable() {
    const p = this.logoPath();
    if (!p) return false;
    try {
      return readFileSync(p).length > 0;
    } catch {
      return false;
    }
  }
}
