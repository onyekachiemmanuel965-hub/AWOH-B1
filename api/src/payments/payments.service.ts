import {
  Inject,
  Injectable,
  NotFoundException,
  BadRequestException,
  HttpException,
  HttpStatus,
  forwardRef,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  Prisma,
} from '@prisma/client';
import { createHash, randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { OrdersService } from '../orders/orders.service';
import { toPublicOrder } from '../orders/orders.mapper';
import {
  PAYMENT_PROVIDER,
  type PaymentProvider,
} from './payment-provider';
import { MockPaymentProvider } from './mock-payment.provider';
import { PaystackWebhookVerifier } from './paystack-webhook.verifier';
import { ReceiptService } from './receipt.service';
import { amountsEqual, fromMinorUnits, toMinorUnits } from '../common/money';
import { AuditService } from '../audit/audit.service';
import { InMemoryRateLimiter } from '../common/in-memory-rate-limiter';

const orderInclude = {
  items: true,
  payments: true,
  receipt: true,
} satisfies Prisma.OrderInclude;

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => OrdersService))
    private readonly orders: OrdersService,
    private readonly config: ConfigService,
    @Inject(PAYMENT_PROVIDER) private readonly provider: PaymentProvider,
    private readonly webhookVerifier: PaystackWebhookVerifier,
    private readonly receipts: ReceiptService,
    private readonly audit: AuditService,
    private readonly rateLimiter: InMemoryRateLimiter,
  ) {}

  private callbackBase() {
    return (
      this.config.get<string>('PAYMENT_CALLBACK_URL') ||
      'http://localhost:3000/account/orders'
    );
  }

  async initializePaystack(userId: string, orderId: string) {
    if (
      !this.rateLimiter.attempt(
        `paystack-init:${userId}`,
        20,
        15 * 60 * 1000,
      )
    ) {
      throw new HttpException(
        'Too many payment attempts. Please try again later.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const order = await this.orders.getOwnedEntity(userId, orderId);
    this.orders.assertPayable(order, userId);

    if (order.status === OrderStatus.AWAITING_OFFLINE_PAYMENT) {
      throw new BadRequestException(
        'This order is awaiting offline payment confirmation.',
      );
    }

    let payment = order.payments.find(
      (p) =>
        p.method === PaymentMethod.PAYSTACK &&
        (p.status === PaymentStatus.PENDING ||
          p.status === PaymentStatus.PROCESSING) &&
        amountsEqual(p.amount.toString(), order.total.toString()),
    );

    // Stale attempts (wrong amount after delivery change) must not be reused
    const stale = order.payments.filter(
      (p) =>
        p.method === PaymentMethod.PAYSTACK &&
        (p.status === PaymentStatus.PENDING ||
          p.status === PaymentStatus.PROCESSING) &&
        !amountsEqual(p.amount.toString(), order.total.toString()),
    );
    if (stale.length > 0) {
      await this.prisma.payment.updateMany({
        where: { id: { in: stale.map((p) => p.id) } },
        data: { status: PaymentStatus.CANCELLED },
      });
    }

    if (!payment) {
      payment = await this.prisma.payment.create({
        data: {
          orderId: order.id,
          method: PaymentMethod.PAYSTACK,
          provider: this.provider.name,
          amount: order.total,
          currency: order.currency,
          status: PaymentStatus.PENDING,
        },
      });
    }

    if (payment.status === PaymentStatus.SUCCESS) {
      throw new BadRequestException('Payment already completed.');
    }

    // Reuse existing provider reference when re-initializing the same pending payment
    const reference =
      payment.providerReference ||
      `awoh_${order.orderNumber}_${randomBytes(4).toString('hex')}`;

    const amountMinor = toMinorUnits(order.total.toString());
    const init = await this.provider.initialize({
      email: order.contactEmail,
      amountMinor,
      currency: order.currency,
      reference,
      callbackUrl: `${this.callbackBase()}/${order.id}?pay=1`,
      metadata: {
        orderId: order.id,
        orderNumber: order.orderNumber,
      },
    });

    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: { id: payment!.id },
        data: {
          provider: this.provider.name,
          providerReference: init.reference,
          accessCode: init.accessCode,
          authorizationUrl: init.authorizationUrl,
          status: PaymentStatus.PROCESSING,
          amount: order.total,
          currency: order.currency,
        },
      });
      await tx.order.update({
        where: { id: order.id },
        data: { status: OrderStatus.PENDING_PAYMENT },
      });
      return tx.order.findUniqueOrThrow({
        where: { id: order.id },
        include: orderInclude,
      });
    });

    return {
      order: toPublicOrder(updated),
      authorizationUrl: init.authorizationUrl,
      accessCode: init.accessCode,
      reference: init.reference,
      publicKey: this.config.get<string>('PAYSTACK_PUBLIC_KEY') || null,
      provider: this.provider.name,
    };
  }

  async verifyByReference(userId: string, reference: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { providerReference: reference },
      include: { order: { include: orderInclude } },
    });
    if (!payment || payment.order.userId !== userId) {
      throw new NotFoundException('Payment not found.');
    }
    return this.applyVerification(payment.id, reference);
  }

  async verifyOrderPayment(userId: string, orderId: string, reference?: string) {
    if (
      !this.rateLimiter.attempt(
        `paystack-verify:${userId}`,
        40,
        15 * 60 * 1000,
      )
    ) {
      throw new HttpException(
        'Too many verification attempts. Please try again later.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const order = await this.orders.getOwnedEntity(userId, orderId);
    const payment =
      order.payments.find(
        (p) =>
          p.method === PaymentMethod.PAYSTACK &&
          (reference
            ? p.providerReference === reference
            : Boolean(p.providerReference)),
      ) || order.payments.find((p) => p.method === PaymentMethod.PAYSTACK);

    if (!payment?.providerReference) {
      throw new BadRequestException('No payment reference to verify.');
    }
    return this.applyVerification(payment.id, payment.providerReference);
  }

  private async applyVerification(paymentId: string, reference: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: { order: true },
    });
    if (!payment) throw new NotFoundException('Payment not found.');

    if (payment.status === PaymentStatus.SUCCESS) {
      const full = await this.prisma.order.findUniqueOrThrow({
        where: { id: payment.orderId },
        include: orderInclude,
      });
      return { order: toPublicOrder(full), alreadyProcessed: true };
    }

    if (
      payment.status === PaymentStatus.CANCELLED ||
      payment.status === PaymentStatus.FAILED
    ) {
      throw new BadRequestException(
        'This payment attempt is no longer valid. Initialize a new payment.',
      );
    }

    this.orders.assertPayable(payment.order, payment.order.userId);

    if (!amountsEqual(payment.amount.toString(), payment.order.total.toString())) {
      await this.prisma.payment.update({
        where: { id: payment.id },
        data: { status: PaymentStatus.CANCELLED },
      });
      throw new BadRequestException(
        'Payment amount no longer matches the order total. Initialize a new payment.',
      );
    }

    const verified = await this.provider.verify(reference);
    if (verified.status !== 'success') {
      await this.prisma.payment.update({
        where: { id: payment.id },
        data: { status: PaymentStatus.FAILED },
      });
      await this.prisma.order.update({
        where: { id: payment.orderId },
        data: { status: OrderStatus.PAYMENT_FAILED },
      });
      throw new BadRequestException('Payment verification failed.');
    }

    const expectedMinor = toMinorUnits(payment.order.total.toString());
    if (verified.amountMinor !== expectedMinor) {
      throw new BadRequestException('Payment amount mismatch.');
    }
    if (
      verified.currency.toUpperCase() !== payment.order.currency.toUpperCase()
    ) {
      throw new BadRequestException('Payment currency mismatch.');
    }

    const full = await this.finalizeSuccessfulPayment(
      payment.id,
      payment.orderId,
      verified.paidAt,
    );
    return { order: toPublicOrder(full), alreadyProcessed: false };
  }

  async handlePaystackWebhook(rawBody: Buffer, signature?: string) {
    this.webhookVerifier.verifySignature(rawBody, signature);
    const payload = JSON.parse(rawBody.toString('utf8')) as {
      event?: string;
      data?: { reference?: string; status?: string };
    };
    const reference = payload.data?.reference;
    if (!reference) {
      return { ok: true, ignored: true };
    }
    if (payload.event && !payload.event.includes('charge')) {
      return { ok: true, ignored: true };
    }

    const payment = await this.prisma.payment.findUnique({
      where: { providerReference: reference },
    });
    if (!payment) {
      return { ok: true, ignored: true };
    }
    if (payment.status === PaymentStatus.SUCCESS) {
      return { ok: true, duplicate: true };
    }

    try {
      await this.applyVerification(payment.id, reference);
      return { ok: true };
    } catch {
      return { ok: true, failed: true };
    }
  }

  /**
   * Staff/admin confirms offline/cash payment.
   * Idempotent when already SUCCESS. Customers must never call this.
   */
  async confirmOfflinePayment(
    actorUserId: string,
    orderId: string,
    reason?: string,
    ip?: string,
  ) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: orderInclude,
    });
    if (!order) throw new NotFoundException('Order not found.');

    if (order.fulfillmentMethod === 'DELIVERY') {
      this.orders.assertPayable(order, order.userId);
    }

    const offline = [...order.payments]
      .filter((p) => p.method === PaymentMethod.OFFLINE_CASH)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];

    if (!offline) {
      throw new BadRequestException(
        'Order has no offline/cash payment to confirm.',
      );
    }

    if (offline.status === PaymentStatus.SUCCESS && order.status === OrderStatus.PAID) {
      return { order: toPublicOrder(order), alreadyProcessed: true };
    }

    if (
      order.status !== OrderStatus.AWAITING_OFFLINE_PAYMENT &&
      offline.status !== PaymentStatus.PENDING
    ) {
      throw new BadRequestException(
        'Order is not awaiting offline payment confirmation.',
      );
    }

    if (!amountsEqual(offline.amount.toString(), order.total.toString())) {
      throw new BadRequestException(
        'Offline payment amount does not match the authoritative order total.',
      );
    }

    const full = await this.finalizeSuccessfulPayment(
      offline.id,
      order.id,
      new Date(),
    );

    await this.audit.log({
      actorUserId,
      action: 'payment.confirm_offline',
      entityType: 'Order',
      entityId: order.id,
      ip,
      metadata: {
        paymentId: offline.id,
        amount: order.total.toString(),
        currency: order.currency,
        reason: reason ?? null,
        alreadyProcessed: false,
      },
    });

    return { order: toPublicOrder(full), alreadyProcessed: false };
  }

  /** Test/dev helper when using MockPaymentProvider */
  markMockSuccess(reference: string) {
    if (this.provider instanceof MockPaymentProvider) {
      this.provider.markSuccess(reference);
    }
  }

  private async finalizeSuccessfulPayment(
    paymentId: string,
    orderId: string,
    paidAt: Date | null,
  ) {
    await this.prisma.$transaction(async (tx) => {
      const current = await tx.payment.findUnique({ where: { id: paymentId } });
      if (!current) throw new NotFoundException('Payment not found.');
      if (current.status === PaymentStatus.SUCCESS) {
        return;
      }

      await tx.payment.update({
        where: { id: paymentId },
        data: {
          status: PaymentStatus.SUCCESS,
          paidAt: paidAt ?? new Date(),
        },
      });
      await tx.order.update({
        where: { id: orderId },
        data: { status: OrderStatus.PAID },
      });
    });

    const order = await this.prisma.order.findUniqueOrThrow({
      where: { id: orderId },
      include: { items: true, payments: true, receipt: true },
    });

    if (!order.receipt) {
      const pdfPath = await this.receipts.generatePdf(order);
      const email = await this.receipts.sendEmailReceipt(order, pdfPath);
      await this.prisma.receipt.create({
        data: {
          orderId: order.id,
          storagePath: pdfPath,
          emailStatus: email.status,
        },
      });
    }

    return this.prisma.order.findUniqueOrThrow({
      where: { id: orderId },
      include: orderInclude,
    });
  }

  async getReceiptForUser(userId: string, orderId: string) {
    const order = await this.orders.getOwnedEntity(userId, orderId);
    if (order.status !== OrderStatus.PAID || !order.receipt) {
      throw new BadRequestException('Receipt is not available yet.');
    }
    return order.receipt;
  }

  /** Integrity helper for tests */
  assertAmountMatchesOrder(orderTotal: string, paymentAmount: string) {
    return amountsEqual(orderTotal, paymentAmount);
  }

  hashIdempotency(input: string) {
    return createHash('sha256').update(input).digest('hex').slice(0, 32);
  }

  describeMinor(minor: bigint) {
    return fromMinorUnits(minor);
  }
}
