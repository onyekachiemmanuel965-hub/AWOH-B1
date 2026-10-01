"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  EmptyState,
  ErrorState,
  LoadingSpinner,
} from "@/components/feedback/feedback";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/components/auth/auth-provider";
import { fetchAdminProducts, type StaffProduct } from "@/lib/admin-api";
import { formatMoney } from "@/lib/money";

export default function AdminProductsPage() {
  const { user } = useAuth();
  const [products, setProducts] = useState<StaffProduct[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const canCreate =
    user?.role === "ADMIN" || user?.role === "CONTENT_MANAGER";

  async function load() {
    setLoading(true);
    try {
      const res = await fetchAdminProducts({ q: q || undefined, limit: 50 });
      setProducts(res.data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load products.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!user) return;
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="type-h2 text-primary">Products</h1>
          <p className="mt-1 type-body-sm text-text-muted">
            Catalog CMS — public DTOs never expose stock or weight.
          </p>
          <p className="mt-1 type-body-sm text-text-muted">
            Open a product to update details, price, stock, or availability
            (by your role).
          </p>
        </div>
        {canCreate ? (
          <Link
            href="/admin/products/new"
            className="inline-flex h-11 items-center justify-center rounded-md border border-primary bg-primary px-5 type-button text-text-inverse no-underline"
          >
            New product
          </Link>
        ) : null}
      </div>

      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          void load();
        }}
      >
        <Input id="q" label="Search" value={q} onChange={(e) => setQ(e.target.value)} />
        <div className="flex items-end">
          <Button type="submit">Search</Button>
        </div>
      </form>

      {loading ? (
        <LoadingSpinner label="Loading products…" />
      ) : error ? (
        <ErrorState title="Products unavailable" description={error} />
      ) : products.length === 0 ? (
        <EmptyState title="No products" description="Create a product to begin." />
      ) : (
        <div className="overflow-x-auto border border-border">
          <table className="w-full min-w-[640px] border-collapse text-left">
            <thead className="bg-surface-muted">
              <tr>
                <th className="px-3 py-2 type-caption">Name</th>
                <th className="px-3 py-2 type-caption">Category</th>
                <th className="px-3 py-2 type-caption">Tile Size</th>
                <th className="px-3 py-2 type-caption">Price</th>
                <th className="px-3 py-2 type-caption">Status</th>
                <th className="px-3 py-2 type-caption">Stock</th>
                <th className="px-3 py-2 type-caption">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className="border-t border-border">
                  <td className="px-3 py-2 type-body-sm">
                    <Link href={`/admin/products/${p.id}`} className="text-primary">
                      {p.name}
                    </Link>
                  </td>
                  <td className="px-3 py-2 type-body-sm">
                    {p.category.name} / {p.subcategory.name}
                  </td>
                  <td className="px-3 py-2 type-body-sm">
                    {p.tileSizeLabel ?? "—"}
                  </td>
                  <td className="px-3 py-2 type-body-sm">
                    {formatMoney(p.price, p.currency)}
                  </td>
                  <td className="px-3 py-2 type-body-sm">
                    {p.status} · {p.availability}
                  </td>
                  <td className="px-3 py-2 type-body-sm">
                    {p.stockQuantity ?? "—"}
                  </td>
                  <td className="px-3 py-2 type-body-sm">
                    <Link
                      href={`/admin/products/${p.id}`}
                      className="inline-flex h-8 items-center justify-center rounded-md border border-border bg-surface px-3 type-caption text-primary no-underline hover:border-primary"
                    >
                      Edit
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
