import {
  DeliveryFeeStatus,
  FulfillmentMethod,
  Order,
  OrderItem,
  OrderStatus,
  Payment,
  PaymentMethod,
  PaymentStatus,
  Receipt,
} from '@prisma/client';

type OrderWithRelations = Order & {
  items: OrderItem[];
  payments: Payment[];
  receipt?: Receipt | null;
};

function deliveryMessage(status: DeliveryFeeStatus): string | null {
  switch (status) {
    case DeliveryFeeStatus.NEEDS_NEGOTIATION:
    case DeliveryFeeStatus.UNCONFIRMED:
    case DeliveryFeeStatus.EXPIRED:
      return 'Please contact AWOH-B to discuss your delivery fee before payment.';
    case DeliveryFeeStatus.QUOTE_AVAILABLE:
    case DeliveryFeeStatus.FEE_SET_BY_STAFF:
      return 'Delivery fee confirmed.';
    case DeliveryFeeStatus.NOT_REQUIRED:
      return 'Pickup selected — delivery fee not required.';
    default:
      return null;
  }
}

export function effectiveDeliveryStatus(order: {
  deliveryFeeStatus: DeliveryFeeStatus;
  deliveryQuoteExpiresAt?: Date | null;
}): DeliveryFeeStatus {
  if (
    order.deliveryFeeStatus === DeliveryFeeStatus.QUOTE_AVAILABLE &&
    order.deliveryQuoteExpiresAt &&
    order.deliveryQuoteExpiresAt.getTime() <= Date.now()
  ) {
    return DeliveryFeeStatus.EXPIRED;
  }
  return order.deliveryFeeStatus;
}

export function isPaymentAllowed(order: {
  deliveryFeeStatus: DeliveryFeeStatus;
  deliveryQuoteExpiresAt?: Date | null;
  status: OrderStatus;
}): boolean {
  if (
    order.status === OrderStatus.CANCELLED ||
    order.status === OrderStatus.PAID
  ) {
    return false;
  }
  const status = effectiveDeliveryStatus(order);
  return (
    status === DeliveryFeeStatus.NOT_REQUIRED ||
    status === DeliveryFeeStatus.QUOTE_AVAILABLE ||
    status === DeliveryFeeStatus.FEE_SET_BY_STAFF
  );
}

export function toPublicOrder(order: OrderWithRelations) {
  const status = effectiveDeliveryStatus(order);
  const paymentAllowed = isPaymentAllowed({ ...order, deliveryFeeStatus: status });
  const latestPayment = [...order.payments].sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
  )[0];

  return {
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    fulfillmentMethod: order.fulfillmentMethod,
    deliveryFeeStatus: status,
    deliveryFee:
      status === DeliveryFeeStatus.NEEDS_NEGOTIATION ||
      status === DeliveryFeeStatus.UNCONFIRMED ||
      status === DeliveryFeeStatus.EXPIRED
        ? null
        : order.deliveryFee?.toString() ?? '0.00',
    deliveryMessage: deliveryMessage(status),
    deliveryQuoteExpiresAt: order.deliveryQuoteExpiresAt?.toISOString() ?? null,
    paymentAllowed,
    subtotal: order.subtotal.toString(),
    total: paymentAllowed ? order.total.toString() : null,
    currency: order.currency,
    contactEmail: order.contactEmail,
    contactPhone: order.contactPhone,
    shippingLine1: order.shippingLine1,
    shippingCity: order.shippingCity,
    shippingState: order.shippingState,
    shippingNotes: order.shippingNotes,
    items: order.items.map((item) => ({
      id: item.id,
      productId: item.productId,
      productName: item.productName,
      productSlug: item.productSlug,
      quantity: item.quantity,
      unitPrice: item.unitPrice.toString(),
      lineTotal: item.lineTotal.toString(),
    })),
    payment: latestPayment
      ? {
          id: latestPayment.id,
          method: latestPayment.method,
          status: latestPayment.status,
          amount: latestPayment.amount.toString(),
          currency: latestPayment.currency,
          providerReference: latestPayment.providerReference,
          paidAt: latestPayment.paidAt?.toISOString() ?? null,
        }
      : null,
    receiptAvailable: Boolean(order.receipt),
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
  };
}

export type { FulfillmentMethod, PaymentMethod, PaymentStatus, OrderStatus };
