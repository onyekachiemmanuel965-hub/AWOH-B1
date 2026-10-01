import { getApiBase } from "./api";

export type StaffRole =
  | "ADMIN"
  | "SALES_STAFF"
  | "INVENTORY_MANAGER"
  | "CONTENT_MANAGER";

const STAFF: StaffRole[] = [
  "ADMIN",
  "SALES_STAFF",
  "INVENTORY_MANAGER",
  "CONTENT_MANAGER",
];

export function isStaffRole(role: string | undefined | null): boolean {
  return !!role && STAFF.includes(role as StaffRole);
}

async function refreshAccessCookie() {
  const res = await fetch(`${getApiBase()}/api/v1/auth/refresh`, {
    method: "POST",
    credentials: "include",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: "{}",
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error("Session expired.");
  }
}

async function adminFetch<T>(
  path: string,
  init?: RequestInit,
  retried = false,
): Promise<T> {
  const res = await fetch(`${getApiBase()}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      Accept: "application/json",
      ...(init?.body && !(init.body instanceof FormData)
        ? { "Content-Type": "application/json" }
        : {}),
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
  if (res.status === 401 && !retried) {
    try {
      await refreshAccessCookie();
      return adminFetch<T>(path, init, true);
    } catch {
      /* fall through to normal error */
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

export type DashboardStats = {
  totals: {
    orders: number;
    pendingPayment: number;
    awaitingOffline: number;
    awaitingDelivery: number;
    paid: number;
    paymentFailed: number;
    products: number;
    lowStock: number;
    outOfStock: number;
  };
  recentOrders: StaffOrder[];
  recentActivity: Array<{
    id: string;
    action: string;
    entityType: string;
    entityId: string;
    actorUserId: string | null;
    createdAt: string;
    metadata: Record<string, unknown> | null;
  }>;
};

export type StaffOrder = {
  id: string;
  orderNumber: string;
  status: string;
  fulfillmentMethod: string;
  deliveryFeeStatus: string;
  deliveryFee: string | null;
  deliveryQuoteExpiresAt: string | null;
  paymentAllowed: boolean;
  subtotal: string;
  total: string;
  currency: string;
  contactEmail: string;
  contactPhone?: string | null;
  shippingLine1?: string | null;
  shippingCity?: string | null;
  shippingLga?: string | null;
  shippingState?: string | null;
  shippingNotes?: string | null;
  deliveryAddress?: {
    state: string | null;
    lga: string | null;
    townCity: string | null;
    address: string | null;
    deliveryInstructions: string | null;
  } | null;
  customer: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
  items: Array<{
    id: string;
    productName: string;
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
  } | null;
  payments: Array<{
    id: string;
    method: string;
    status: string;
    amount: string;
  }>;
  createdAt: string;
};

export type StaffProduct = {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: string;
  currency: string;
  status: string;
  availability: string;
  featured: boolean;
  sortOrder: number;
  tileSize?: string | null;
  tileSizeLabel?: string | null;
  stockQuantity?: number;
  weightPerCartonKg?: string | null;
  category: { id: string; name: string; slug: string };
  subcategory: { id: string; name: string; slug: string };
  images: Array<{
    id: string;
    url: string;
    altText: string | null;
    isPrimary: boolean;
  }>;
};

export function fetchDashboard() {
  return adminFetch<DashboardStats>("/api/v1/admin/dashboard");
}

export function fetchAdminOrders(params: Record<string, string | number | undefined>) {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== "") qs.set(k, String(v));
  });
  return adminFetch<{ data: StaffOrder[]; meta: { page: number; total: number; totalPages: number } }>(
    `/api/v1/admin/orders?${qs.toString()}`,
  );
}

export function fetchAdminOrder(id: string) {
  return adminFetch<StaffOrder>(`/api/v1/admin/orders/${id}`);
}

export function confirmOfflinePayment(orderId: string, reason?: string) {
  return adminFetch<{ order: StaffOrder; alreadyProcessed?: boolean }>(
    `/api/v1/admin/orders/${orderId}/payments/confirm-offline`,
    { method: "POST", body: JSON.stringify({ reason }) },
  );
}

export function fetchDeliveryInternal(orderId: string) {
  return adminFetch<{
    orderId: string;
    deliveryFeeStatus: string;
    deliveryFee: string | null;
    currency: string;
    expiresAt: string | null;
    internal: unknown;
  }>(`/api/v1/orders/${orderId}/delivery/internal`);
}

export function overrideDelivery(orderId: string, deliveryFee: string, reason?: string) {
  return adminFetch(`/api/v1/orders/${orderId}/delivery/override`, {
    method: "POST",
    body: JSON.stringify({ deliveryFee, reason }),
  });
}

export function fetchAdminProducts(params: Record<string, string | number | undefined> = {}) {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== "") qs.set(k, String(v));
  });
  return adminFetch<{ data: StaffProduct[]; meta: { page: number; total: number; totalPages: number } }>(
    `/api/v1/admin/products?${qs.toString()}`,
  );
}

export function fetchAdminProduct(id: string) {
  return adminFetch<StaffProduct>(`/api/v1/admin/products/${id}`);
}

export function createAdminProduct(body: Record<string, unknown>) {
  return adminFetch<StaffProduct>("/api/v1/admin/products", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function updateAdminProduct(id: string, body: Record<string, unknown>) {
  return adminFetch<StaffProduct>(`/api/v1/admin/products/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export function updateProductPrice(id: string, price: string) {
  return adminFetch(`/api/v1/admin/products/${id}/price`, {
    method: "PATCH",
    body: JSON.stringify({ price }),
  });
}

export function updateInventory(id: string, body: Record<string, unknown>) {
  return adminFetch(`/api/v1/admin/products/${id}/inventory`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export function deactivateProduct(id: string) {
  return adminFetch(`/api/v1/admin/products/${id}/deactivate`, {
    method: "POST",
    body: "{}",
  });
}

export function uploadProductImage(productId: string, file: File) {
  const form = new FormData();
  form.append("file", file);
  return adminFetch(`/api/v1/admin/products/${productId}/images`, {
    method: "POST",
    body: form,
  });
}

export function fetchAdminCategories() {
  return adminFetch<
    Array<{
      id: string;
      name: string;
      slug: string;
      status: string;
      subcategoryCount: number;
      subcategories: Array<{ id: string; name: string; slug: string; status: string }>;
    }>
  >("/api/v1/admin/categories");
}

export function createCategory(body: Record<string, unknown>) {
  return adminFetch("/api/v1/admin/categories", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function updateCategory(id: string, body: Record<string, unknown>) {
  return adminFetch(`/api/v1/admin/categories/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export function deactivateCategory(id: string) {
  return adminFetch(`/api/v1/admin/categories/${id}/deactivate`, {
    method: "POST",
    body: "{}",
  });
}

export function fetchAdminSubcategories(categoryId?: string) {
  const qs = categoryId ? `?categoryId=${encodeURIComponent(categoryId)}` : "";
  return adminFetch<
    Array<{
      id: string;
      name: string;
      slug: string;
      status: string;
      productCount: number;
      category: { id: string; name: string; slug: string };
    }>
  >(`/api/v1/admin/subcategories${qs}`);
}

export function createSubcategory(body: Record<string, unknown>) {
  return adminFetch("/api/v1/admin/subcategories", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function updateSubcategory(id: string, body: Record<string, unknown>) {
  return adminFetch(`/api/v1/admin/subcategories/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export function fetchAudit(params: Record<string, string | number | undefined> = {}) {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== "") qs.set(k, String(v));
  });
  return adminFetch<{
    data: Array<{
      id: string;
      action: string;
      entityType: string;
      entityId: string;
      actorUserId: string | null;
      createdAt: string;
      metadata: Record<string, unknown> | null;
    }>;
    meta: { page: number; total: number; totalPages: number };
  }>(`/api/v1/admin/audit?${qs.toString()}`);
}

export function fetchInventory(params: Record<string, string | number | undefined> = {}) {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== "") qs.set(k, String(v));
  });
  return adminFetch<{ data: StaffProduct[]; meta: { page: number; total: number; totalPages: number } }>(
    `/api/v1/admin/inventory?${qs.toString()}`,
  );
}

export { mediaUrl } from "./api";

export type StaffUser = {
  id: string;
  firstName: string;
  lastName: string;
  name: string;
  email: string;
  role: string;
  roleLabel?: string;
  status: string;
  isActive: boolean;
  createdAt: string;
  access?: Array<{ key: string; label: string; href: string }>;
  accessLabels?: string[];
};

export type AssignableRole =
  | "CUSTOMER"
  | "SALES_STAFF"
  | "INVENTORY_MANAGER"
  | "CONTENT_MANAGER"
  | "ADMIN";

export const ASSIGNABLE_ROLES: Array<{ value: AssignableRole; label: string }> =
  [
    { value: "CUSTOMER", label: "Customer" },
    { value: "SALES_STAFF", label: "Sales Staff" },
    { value: "INVENTORY_MANAGER", label: "Inventory Manager" },
    { value: "CONTENT_MANAGER", label: "Content Manager" },
    { value: "ADMIN", label: "Admin (full access)" },
  ];

export type AdminAccessModule = {
  key: string;
  label: string;
  href: string;
};

export type MyAdminAccess = {
  role: string;
  roleLabel: string;
  isActive: boolean;
  firstName: string;
  lastName: string;
  modules: AdminAccessModule[];
  nav: AdminAccessModule[];
  permissions?: string[];
  allowedLabels?: string[];
  restrictedLabels?: string[];
};

export function fetchStaff(params: Record<string, string | number | undefined> = {}) {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== "") qs.set(k, String(v));
  });
  return adminFetch<{
    data: StaffUser[];
    meta: { page: number; total: number; totalPages: number; limit: number };
  }>(`/api/v1/admin/staff?${qs.toString()}`);
}

export function updateStaffRole(id: string, role: AssignableRole) {
  return adminFetch<StaffUser>(`/api/v1/admin/staff/${id}/role`, {
    method: "PATCH",
    body: JSON.stringify({ role }),
  });
}

export function updateStaffStatus(id: string, isActive: boolean) {
  return adminFetch<StaffUser>(`/api/v1/admin/staff/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ isActive }),
  });
}

export function fetchMyAdminAccess() {
  return adminFetch<MyAdminAccess>("/api/v1/admin/me/access");
}

export type AdminStorefrontImage = {
  key: string;
  page: string;
  label: string;
  description: string;
  url: string;
  altText: string;
  isCustom: boolean;
  placeholderPath: string;
  updatedAt: string | null;
};

export function fetchAdminStorefrontImages() {
  return adminFetch<AdminStorefrontImage[]>(
    "/api/v1/admin/storefront-images",
  );
}

export function uploadStorefrontImage(
  key: string,
  file: File,
  altText?: string,
) {
  const form = new FormData();
  form.append("file", file);
  if (altText?.trim()) form.append("altText", altText.trim());
  return adminFetch<AdminStorefrontImage>(
    `/api/v1/admin/storefront-images/${encodeURIComponent(key)}/upload`,
    { method: "POST", body: form },
  );
}

export function updateStorefrontImageAlt(key: string, altText: string) {
  return adminFetch<AdminStorefrontImage>(
    `/api/v1/admin/storefront-images/${encodeURIComponent(key)}`,
    { method: "PATCH", body: JSON.stringify({ altText }) },
  );
}

export function clearStorefrontImage(key: string) {
  return adminFetch<AdminStorefrontImage>(
    `/api/v1/admin/storefront-images/${encodeURIComponent(key)}`,
    { method: "DELETE" },
  );
}

