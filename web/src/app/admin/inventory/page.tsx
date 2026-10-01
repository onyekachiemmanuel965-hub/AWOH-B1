"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import {
  EmptyState,
  ErrorState,
  LoadingSpinner,
} from "@/components/feedback/feedback";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/feedback/toast";
import { useAuth } from "@/components/auth/auth-provider";
import {
  fetchInventory,
  type StaffProduct,
  updateInventory,
} from "@/lib/admin-api";

export default function AdminInventoryPage() {
  const { user } = useAuth();
  const { push } = useToast();
  const [rows, setRows] = useState<StaffProduct[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [stock, setStock] = useState("");
  const [availability, setAvailability] = useState("AVAILABLE");
  const [busy, setBusy] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await fetchInventory({ q: q || undefined, limit: 50 });
      setRows(res.data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!user) return;
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  async function onSave(e: FormEvent) {
    e.preventDefault();
    if (!editId) return;
    setBusy(true);
    try {
      await updateInventory(editId, {
        stockQuantity: Number(stock),
        availability,
      });
      push({ title: "Stock updated", tone: "success" });
      setEditId(null);
      await load();
    } catch (err) {
      push({
        title: "Update failed",
        description: err instanceof Error ? err.message : undefined,
        tone: "error",
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="type-h2 text-primary">Inventory</h1>
        <p className="mt-1 type-body-sm text-text-muted">
          Adjust stock and mark products Available or Unavailable.
        </p>
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
        <LoadingSpinner label="Loading…" />
      ) : error ? (
        <ErrorState title="Unavailable" description={error} />
      ) : rows.length === 0 ? (
        <EmptyState title="No products" description="Nothing to show." />
      ) : (
        <div className="overflow-x-auto border border-border">
          <table className="w-full min-w-[560px] border-collapse text-left">
            <thead className="bg-surface-muted">
              <tr>
                <th className="px-3 py-2 type-caption">Product</th>
                <th className="px-3 py-2 type-caption">Availability</th>
                <th className="px-3 py-2 type-caption">Stock</th>
                <th className="px-3 py-2 type-caption">Weight kg</th>
                <th className="px-3 py-2 type-caption">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => (
                <tr key={p.id} className="border-t border-border">
                  <td className="px-3 py-2 type-body-sm">
                    <Link href={`/admin/products/${p.id}`} className="text-primary">
                      {p.name}
                    </Link>
                  </td>
                  <td className="px-3 py-2 type-body-sm">
                    {p.availability === "AVAILABLE" ? "Available" : "Unavailable"}
                  </td>
                  <td className="px-3 py-2 type-body-sm">{p.stockQuantity ?? "—"}</td>
                  <td className="px-3 py-2 type-body-sm">
                    {p.weightPerCartonKg ?? "—"}
                  </td>
                  <td className="px-3 py-2 type-body-sm">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditId(p.id);
                        setStock(String(p.stockQuantity ?? 0));
                        setAvailability(p.availability ?? "AVAILABLE");
                      }}
                    >
                      Adjust
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {editId ? (
        <form
          className="flex flex-wrap gap-3 border border-border bg-surface p-4"
          onSubmit={onSave}
        >
          <Input
            id="stock"
            label="New stock"
            value={stock}
            onChange={(e) => setStock(e.target.value)}
          />
          <label className="block min-w-[10rem]" htmlFor="inv-availability">
            <span className="type-caption text-text-muted">Sell status</span>
            <select
              id="inv-availability"
              className="mt-1 w-full border border-border bg-surface px-3 py-2"
              value={availability}
              onChange={(e) => setAvailability(e.target.value)}
            >
              <option value="AVAILABLE">Available</option>
              <option value="UNAVAILABLE">Unavailable</option>
            </select>
          </label>
          <div className="flex items-end gap-2">
            <Button type="submit" loading={busy}>
              Save
            </Button>
            <Button type="button" variant="ghost" onClick={() => setEditId(null)}>
              Cancel
            </Button>
          </div>
        </form>
      ) : null}
    </div>
  );
}
