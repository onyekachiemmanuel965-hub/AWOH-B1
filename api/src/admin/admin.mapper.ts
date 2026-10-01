import {
  DeliveryFeeStatus,
  FulfillmentMethod,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
} from '@prisma/client';
import {
  effectiveDeliveryStatus,
  isPaymentAllowed,
} from '../orders/orders.mapper';
import { getTileSize, type TileSizeCode } from '../catalog/tile-size';

type StaffOrder = {
  id: string;
  orderNumber: string;
  userId: string;
  status: OrderStatus;
  fulfillmentMethod: FulfillmentMethod;
  deliveryFeeStatus: DeliveryFeeStatus;
  deliveryFee: { toString(): string } | null;
  deliveryQuoteExpiresAt: Date | null;
  subtotal: { toString(): string };
  total: { toString(): string };
  currency: string;
  contactEmail: string;
  contactPhone: string | null;
  shippingLine1: string | null;
  shippingCity: string | null;
  shippingLga?: string | null;
  shippingState: string | null;
  shippingNotes: string | null;
  createdAt: Date;
  updatedAt: Date;
  user?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
  items: Array<{
    id: string;
    productId: string;
    productName: string;
    productSlug: string;
    quantity: number;
    unitPrice: { toString(): string };
    lineTotal: { toString(): string };
  }>;
  payments: Array<{
    id: string;
    method: PaymentMethod;
    status: PaymentStatus;
    amount: { toString(): string };
    currency: string;
    providerReference: string | null;
    paidAt: Date | null;
    createdAt: Date;
  }>;
  receipt?: { id: string } | null;
};

/** Staff order DTO — never includes deliveryInternalJson / weights / rates. */
export function toStaffOrder(order: StaffOrder) {
  const deliveryFeeStatus = effectiveDeliveryStatus(order);
  const latestPayment = [...order.payments].sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
  )[0];

  return {
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    fulfillmentMethod: order.fulfillmentMethod,
    deliveryFeeStatus,
    deliveryFee: order.deliveryFee?.toString() ?? null,
    deliveryQuoteExpiresAt: order.deliveryQuoteExpiresAt?.toISOString() ?? null,
    paymentAllowed: isPaymentAllowed({ ...order, deliveryFeeStatus }),
    subtotal: order.subtotal.toString(),
    total: order.total.toString(),
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
    customer: order.user
      ? {
          id: order.user.id,
          email: order.user.email,
          firstName: order.user.firstName,
          lastName: order.user.lastName,
        }
      : { id: order.userId, email: order.contactEmail, firstName: '', lastName: '' },
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
    payments: order.payments.map((p) => ({
      id: p.id,
      method: p.method,
      status: p.status,
      amount: p.amount.toString(),
      currency: p.currency,
      providerReference: p.providerReference,
      paidAt: p.paidAt?.toISOString() ?? null,
      createdAt: p.createdAt.toISOString(),
    })),
    receiptAvailable: Boolean(order.receipt),
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
  };
}

/** Staff product DTO — may include stock/weight for authorized roles. */
export function toStaffProduct(
  product: {
    id: string;
    name: string;
    slug: string;
    description: string;
    price: { toString(): string };
    currency: string;
    status: string;
    availability: string;
    stockQuantity: number;
    weightPerCartonKg: { toString(): string } | null;
    tileSize?: string | null;
    specsJson: string | null;
    featured: boolean;
    sortOrder: number;
    createdAt: Date;
    updatedAt: Date;
    subcategory: {
      id: string;
      name: string;
      slug: string;
      category: { id: string; name: string; slug: string };
    };
    images: Array<{
      id: string;
      url: string;
      altText: string | null;
      sortOrder: number;
      isPrimary: boolean;
    }>;
  },
  opts: { includeInventory: boolean; includeWeight: boolean },
) {
  let specs: Record<string, string> | null = null;
  if (product.specsJson) {
    try {
      const parsed = JSON.parse(product.specsJson) as unknown;
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        specs = parsed as Record<string, string>;
      }
    } catch {
      specs = null;
    }
  }

  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    description: product.description,
    price: product.price.toString(),
    currency: product.currency,
    status: product.status,
    availability: product.availability,
    featured: product.featured,
    sortOrder: product.sortOrder,
    tileSize: product.tileSize ?? null,
    tileSizeLabel:
      getTileSize(product.tileSize as TileSizeCode | null)?.label ?? null,
    specs,
    stockQuantity: opts.includeInventory ? product.stockQuantity : undefined,
    weightPerCartonKg:
      opts.includeWeight && product.weightPerCartonKg
        ? product.weightPerCartonKg.toString()
        : opts.includeWeight
          ? null
          : undefined,
    category: product.subcategory.category,
    subcategory: {
      id: product.subcategory.id,
      name: product.subcategory.name,
      slug: product.subcategory.slug,
    },
    images: [...product.images]
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((img) => ({
        id: img.id,
        url: img.url,
        altText: img.altText,
        sortOrder: img.sortOrder,
        isPrimary: img.isPrimary,
      })),
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString(),
  };
}
