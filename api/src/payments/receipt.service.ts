import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createWriteStream, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import PDFDocument = require('pdfkit');
import { Order, OrderItem, Payment } from '@prisma/client';

type ReceiptOrder = Order & { items: OrderItem[]; payments: Payment[] };

/** Customer-safe receipt lines — never includes deliveryInternalJson / weights / rates. */
export function buildReceiptTextLines(order: ReceiptOrder): string[] {
  const payment = order.payments.find((p) => p.status === 'SUCCESS');
  const lines: string[] = [
    'AWOH-B THE GREAT TILES VENTURE',
    'Payment Receipt',
    `Order number: ${order.orderNumber}`,
    `Date: ${order.createdAt.toISOString().slice(0, 10)}`,
    `Fulfillment: ${order.fulfillmentMethod}`,
  ];
  for (const item of order.items) {
    lines.push(
      `${item.productName} × ${item.quantity} @ ${item.unitPrice.toString()} = ${item.lineTotal.toString()} ${order.currency}`,
    );
  }
  lines.push(`Subtotal: ${order.subtotal.toString()} ${order.currency}`);
  if (order.deliveryFee != null) {
    lines.push(
      `Delivery fee: ${order.deliveryFee.toString()} ${order.currency}`,
    );
  }
  lines.push(`Total: ${order.total.toString()} ${order.currency}`);
  if (payment) {
    lines.push(`Payment method: ${payment.method}`);
    lines.push(`Payment status: ${payment.status}`);
    if (payment.providerReference) {
      lines.push(`Reference: ${payment.providerReference}`);
    }
  }
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

  async generatePdf(order: ReceiptOrder): Promise<string> {
    const fileName = `${order.orderNumber}.pdf`;
    const fullPath = join(this.receiptsDir(), fileName);
    const textLines = buildReceiptTextLines(order);

    await new Promise<void>((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50 });
      const stream = createWriteStream(fullPath);
      doc.pipe(stream);

      textLines.forEach((line, index) => {
        if (index === 0) {
          doc.fontSize(18).text(line, { align: 'left' });
          doc.moveDown(0.5);
        } else if (index === 1) {
          doc.fontSize(12).fillColor('#5C6570').text(line);
          doc.fillColor('#000000');
          doc.moveDown();
        } else {
          doc.text(line);
        }
      });

      doc.end();
      stream.on('finish', () => resolve());
      stream.on('error', reject);
    });

    return fullPath;
  }

  async sendEmailReceipt(order: ReceiptOrder, pdfPath: string) {
    const mode = this.config.get<string>('EMAIL_MODE') || 'console';
    if (mode === 'console') {
      this.logger.log(
        `[email:console] Receipt for ${order.orderNumber} → ${order.contactEmail} (${pdfPath})`,
      );
      return { status: 'LOGGED' as const };
    }
    this.logger.warn(
      `EMAIL_MODE=${mode} is not fully configured; receipt logged only.`,
    );
    return { status: 'PENDING_CONFIG' as const };
  }

  resolvePath(storagePath: string) {
    return storagePath;
  }
}
