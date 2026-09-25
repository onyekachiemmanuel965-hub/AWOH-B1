import { getApiBase } from "./api";

export type PublicOrder = {
  id: string;
  orderNumber: string;
  status: string;
  fulfillmentMethod: "PICKUP" | "DELIVERY";
  deliveryFeeStatus: string;
  deliveryFee: string | null;
  deliveryMessage: string | null;
  paymentAllowed: boolean;
  subtotal: string;
  total: string | null;
  currency: string;
  contactEmail: string;
  contactPhone: string | null;
  shippingLine1: string | null;
  shippingCity: string | null;
  shippingState: string | null;
  shippingNotes: string | null;
  items: Array<{
    id: string;
    productId: string;
    productName: string;
    productSlug: string;
    quantity: number;
    unitPrice: string;
    lineTotal: string;
  }>;
  payment: {
    id: string;
    method: string;
    status: string;
    amount: string;
    currency: string;
    providerReference: string | null;
    paidAt: string | null;
  } | null;
  receiptAvailable: boolean;
  createdAt: string;
  updatedAt: string;
};

async function orderFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${getApiBase()}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      Accept: "application/json",
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });
  const text = await res.text();
  let body: unknown = null;
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = { message: text };
    }
  }
  if (!res.ok) {
    const message =
      typeof body === "object" &&
      body &&
      "message" in body &&
      (body as { message: unknown }).message
        ? Array.isArray((body as { message: unknown }).message)
          ? ((body as { message: string[] }).message).join(", ")
          : String((body as { message: unknown }).message)
        : "Request failed.";
    throw Object.assign(new Error(message), { status: res.status });
  }
  return body as T;
}

export async function createOrder(payload: Record<string, unknown>) {
  return orderFetch<PublicOrder>("/api/v1/orders", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function fetchOrders() {
  return orderFetch<PublicOrder[]>("/api/v1/orders");
}

export async function fetchOrder(orderId: string) {
  return orderFetch<PublicOrder>(`/api/v1/orders/${orderId}`);
}

export async function initializePayment(orderId: string) {
  return orderFetch<{
    order: PublicOrder;
    authorizationUrl: string;
    accessCode: string;
    reference: string;
    publicKey: string | null;
    provider: string;
  }>(`/api/v1/orders/${orderId}/payment/initialize`, {
    method: "POST",
    body: "{}",
  });
}

export async function verifyPayment(orderId: string, reference?: string) {
  return orderFetch<{ order: PublicOrder; alreadyProcessed?: boolean }>(
    `/api/v1/orders/${orderId}/payment/verify`,
    {
      method: "POST",
      body: JSON.stringify(reference ? { reference } : {}),
    },
  );
}

export function receiptDownloadUrl(orderId: string) {
  return `${getApiBase()}/api/v1/orders/${orderId}/receipt`;
}
