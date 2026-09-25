import { Currency, formatMoney } from "./money";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ||
  "http://localhost:4000";

export type PublicCategory = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  sortOrder: number;
  subcategories: Array<{
    id: string;
    name: string;
    slug: string;
    description: string | null;
    imageUrl: string | null;
    sortOrder: number;
  }>;
};

export type PublicProduct = {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: string;
  currency: Currency | string;
  availability: "AVAILABLE" | "UNAVAILABLE";
  featured: boolean;
  /** Machine-safe size key e.g. "60x60" */
  tileSize: string | null;
  tileSizeLabel: string | null;
  /** width/height for CSS aspect-ratio */
  tileAspectRatio: number | null;
  specs: Record<string, string> | null;
  category: { id: string; name: string; slug: string };
  subcategory: { id: string; name: string; slug: string };
  images: Array<{
    id: string;
    url: string;
    altText: string | null;
    sortOrder: number;
    isPrimary: boolean;
  }>;
  primaryImage: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ProductListResponse = {
  data: PublicProduct[];
  meta: {
    total: number;
    page: number;
    limit: number;
    pageCount: number;
  };
};

export type ProductQuery = {
  category?: string;
  subcategory?: string;
  q?: string;
  sort?: string;
  page?: number;
  limit?: number;
  featured?: boolean;
};

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
      ...(init?.headers ?? {}),
    },
    next: init?.cache === "no-store" ? undefined : { revalidate: 30 },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(body || `Request failed (${res.status})`);
  }
  return res.json() as Promise<T>;
}

export function getApiBase() {
  return API_BASE;
}

export async function fetchCategories() {
  return apiFetch<PublicCategory[]>("/api/v1/categories", {
    cache: "no-store",
  });
}

export async function fetchCategory(slug: string) {
  return apiFetch<PublicCategory>(`/api/v1/categories/${slug}`, {
    cache: "no-store",
  });
}

export async function fetchSubcategory(
  categorySlug: string,
  subcategorySlug: string,
) {
  return apiFetch<{
    id: string;
    name: string;
    slug: string;
    description: string | null;
    imageUrl: string | null;
    category: { id: string; name: string; slug: string };
  }>(`/api/v1/categories/${categorySlug}/subcategories/${subcategorySlug}`, {
    cache: "no-store",
  });
}

export async function fetchProducts(query: ProductQuery = {}) {
  const params = new URLSearchParams();
  if (query.category) params.set("category", query.category);
  if (query.subcategory) params.set("subcategory", query.subcategory);
  if (query.q) params.set("q", query.q);
  if (query.sort) params.set("sort", query.sort);
  if (query.page) params.set("page", String(query.page));
  if (query.limit) params.set("limit", String(query.limit));
  if (query.featured) params.set("featured", "true");
  const qs = params.toString();
  return apiFetch<ProductListResponse>(
    `/api/v1/products${qs ? `?${qs}` : ""}`,
    { cache: "no-store" },
  );
}

export async function fetchProduct(slug: string) {
  return apiFetch<PublicProduct>(`/api/v1/products/${slug}`, {
    cache: "no-store",
  });
}

export async function resolveProducts(ids: string[]) {
  if (ids.length === 0) return [] as PublicProduct[];
  const params = new URLSearchParams({ ids: ids.join(",") });
  return apiFetch<PublicProduct[]>(`/api/v1/products/resolve?${params}`, {
    cache: "no-store",
  });
}

export function formatProductPrice(product: PublicProduct) {
  return formatMoney(product.price, product.currency);
}
