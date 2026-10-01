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

/** Customer-safe delivery quote UX states (not DB enum). */
export type CustomerDeliveryQuoteState =
  | 'NOT_REQUIRED'
  | 'DELIVERY_QUOTE_REQUIRED'
  | 'DELIVERY_QUOTE_PENDING'
  | 'DELIVERY_QUOTE_AVAILABLE'
  | 'DELIVERY_QUOTE_UPDATED'
  | 'DELIVERY_QUOTE_CONFIRMED'
  | 'DELIVERY_QUOTE_EXPIRED';

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

export function isCustomerQuoteConfirmed(order: {
  deliveryQuoteVersion?: number | null;
  deliveryQuoteConfirmedVersion?: number | null;
}): boolean {
  const version = order.deliveryQuoteVersion ?? 0;
  const confirmed = order.deliveryQuoteConfirmedVersion;
  return (
    version > 0 &&
    confirmed != null &&
    confirmed === version
  );
}

export function hasDeliveryAddress(order: {
  shippingLine1?: string | null;
  shippingCity?: string | null;
  shippingLga?: string | null;
  shippingState?: string | null;
}): boolean {
  return Boolean(
    order.shippingLine1?.trim() &&
      order.shippingCity?.trim() &&
      order.shippingLga?.trim() &&
      order.shippingState?.trim(),
  );
}

/**
 * Authoritative payment eligibility — single source for controllers/services.
 * Pickup: delivery not required.
 * Delivery: address + staff fee + customer confirmation of current quote version.
 */
export function isPaymentAllowed(order: {
  deliveryFeeStatus: DeliveryFeeStatus;
  deliveryQuoteExpiresAt?: Date | null;
  deliveryQuoteVersion?: number | null;
  deliveryQuoteConfirmedVersion?: number | null;
  deliveryFee?: { toString(): string } | string | null;
  status: OrderStatus;
  shippingLine1?: string | null;
  shippingCity?: string | null;
  shippingLga?: string | null;
  shippingState?: string | null;
  fulfillmentMethod?: FulfillmentMethod | string;
}): boolean {
  if (
    order.status === OrderStatus.CANCELLED ||
    order.status === OrderStatus.PAID
  ) {
    return false;
  }
  const status = effectiveDeliveryStatus(order);
  if (status === DeliveryFeeStatus.NOT_REQUIRED) {
    return true;
  }
  if (
    order.fulfillmentMethod === FulfillmentMethod.DELIVERY ||
    order.fulfillmentMethod == null
  ) {
    if (!hasDeliveryAddress(order)) {
      return false;
    }
  }
  if (
    status !== DeliveryFeeStatus.QUOTE_AVAILABLE &&
    status !== DeliveryFeeStatus.FEE_SET_BY_STAFF
  ) {
    return false;
  }
  if (order.deliveryFee == null) {
    return false;
  }
  return isCustomerQuoteConfirmed(order);
}

export function toCustomerDeliveryQuoteState(order: {
  fulfillmentMethod?: FulfillmentMethod | string;
  deliveryFeeStatus: DeliveryFeeStatus;
  deliveryQuoteExpiresAt?: Date | null;
  deliveryQuoteVersion?: number | null;
  deliveryQuoteConfirmedVersion?: number | null;
  deliveryFee?: { toString(): string } | string | null;
  shippingLine1?: string | null;
  shippingCity?: string | null;
  shippingLga?: string | null;
  shippingState?: string | null;
}): CustomerDeliveryQuoteState {
  const status = effectiveDeliveryStatus(order);
  if (
    status === DeliveryFeeStatus.NOT_REQUIRED ||
    order.fulfillmentMethod === FulfillmentMethod.PICKUP
  ) {
    return 'NOT_REQUIRED';
  }
  if (status === DeliveryFeeStatus.EXPIRED) {
    return 'DELIVERY_QUOTE_EXPIRED';
  }
  if (
    status === DeliveryFeeStatus.QUOTE_AVAILABLE ||
    status === DeliveryFeeStatus.FEE_SET_BY_STAFF
  ) {
    if (order.deliveryFee == null) {
      return 'DELIVERY_QUOTE_PENDING';
    }
    const version = order.deliveryQuoteVersion ?? 0;
    const confirmed = order.deliveryQuoteConfirmedVersion;
    if (confirmed != null && confirmed === version) {
      return 'DELIVERY_QUOTE_CONFIRMED';
    }
    if (confirmed != null && confirmed !== version) {
      return 'DELIVERY_QUOTE_UPDATED';
    }
    return 'DELIVERY_QUOTE_AVAILABLE';
  }
  if (!hasDeliveryAddress(order)) {
    return 'DELIVERY_QUOTE_REQUIRED';
  }
  return 'DELIVERY_QUOTE_PENDING';
}

function deliveryMessageForState(
  state: CustomerDeliveryQuoteState,
): string | null {
  switch (state) {
    case 'DELIVERY_QUOTE_REQUIRED':
      return 'Please complete your delivery address to request a delivery quote.';
    case 'DELIVERY_QUOTE_PENDING':
      return 'Please contact our Sales Staff to discuss and agree on your delivery fee.';
    case 'DELIVERY_QUOTE_AVAILABLE':
      return 'Your delivery quote is ready. Review the delivery fee below and confirm it before proceeding to payment.';
    case 'DELIVERY_QUOTE_UPDATED':
      return 'Your delivery quote has been updated. Please review and confirm the new delivery fee before payment.';
    case 'DELIVERY_QUOTE_CONFIRMED':
      return 'Delivery quote confirmed. You can proceed with payment.';
    case 'DELIVERY_QUOTE_EXPIRED':
      return 'Your delivery quote has expired. Please contact Sales Staff for an updated delivery quote.';
    case 'NOT_REQUIRED':
      return 'Pickup selected — delivery fee not required.';
    default:
      return null;
  }
}

export function toPublicOrder(order: OrderWithRelations) {
  const status = effectiveDeliveryStatus(order);
  const quoteState = toCustomerDeliveryQuoteState({
    ...order,
    deliveryFeeStatus: status,
  });
  const quoteConfirmed = isCustomerQuoteConfirmed(order);
  const paymentAllowed = isPaymentAllowed({
    ...order,
    deliveryFeeStatus: status,
  });
  const feeVisible =
    status === DeliveryFeeStatus.QUOTE_AVAILABLE ||
    status === DeliveryFeeStatus.FEE_SET_BY_STAFF;
  const latestPayment = [...order.payments].sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
  )[0];

  return {
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    fulfillmentMethod: order.fulfillmentMethod,
    deliveryFeeStatus: status,
    deliveryQuoteStatus: quoteState,
    deliveryQuoteConfirmed: quoteConfirmed,
    deliveryFee: feeVisible ? order.deliveryFee?.toString() ?? null : null,
    deliveryMessage: deliveryMessageForState(quoteState),
    deliveryQuoteExpiresAt: order.deliveryQuoteExpiresAt?.toISOString() ?? null,
    paymentAllowed,
    subtotal: order.subtotal.toString(),
    // Show total whenever a staff fee exists so customer can review before confirm.
    total: feeVisible
      ? order.total.toString()
      : status === DeliveryFeeStatus.NOT_REQUIRED
        ? order.total.toString()
        : null,
    currency: order.currency,
    contactEmail: order.contactEmail,
    contactPhone: order.contactPhone,
    shippingLine1: order.shippingLine1,
    shippingCity: order.shippingCity,
    shippingLga: order.shippingLga ?? null,
    shippingState: order.shippingState,
    shippingNotes: order.shippingNotes,
    deliveryAddress:
      order.fulfillmentMethod === FulfillmentMethod.DELIVERY
        ? {
            state: order.shippingState,
            lga: order.shippingLga ?? null,
            townCity: order.shippingCity,
            address: order.shippingLine1,
            deliveryInstructions: order.shippingNotes,
          }
        : null,
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
