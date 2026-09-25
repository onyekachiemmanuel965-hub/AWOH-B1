"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  EmptyState,
  ErrorState,
  LoadingSpinner,
} from "@/components/feedback/feedback";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/feedback/toast";
import {
  createSubcategory,
  fetchAdminCategories,
  fetchAdminSubcategories,
} from "@/lib/admin-api";

export default function AdminSubcategoriesPage() {
  const { push } = useToast();
  const [cats, setCats] = useState<Array<{ id: string; name: string }>>([]);
  const [rows, setRows] = useState<
    Array<{
      id: string;
      name: string;
      slug: string;
      status: string;
      productCount: number;
      category: { name: string };
    }>
  >([]);
  const [categoryId, setCategoryId] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const [c, s] = await Promise.all([
        fetchAdminCategories(),
        fetchAdminSubcategories(),
      ]);
      setCats(c);
      setRows(s);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await createSubcategory({ categoryId, name });
      setName("");
      push({ title: "Subcategory created", tone: "success" });
      await load();
    } catch (err) {
      push({
        title: "Create failed",
        description: err instanceof Error ? err.message : undefined,
        tone: "error",
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="type-h2 text-primary">Subcategories</h1>
      <form className="grid gap-3 sm:grid-cols-3" onSubmit={onCreate}>
        <label className="block">
          <span className="type-caption text-text-muted">Category</span>
          <select
            required
            className="mt-1 w-full border border-border bg-surface px-3 py-2"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
          >
            <option value="">Select…</option>
            {cats.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <Input id="name" label="Name" required value={name} onChange={(e) => setName(e.target.value)} />
        <div className="flex items-end">
          <Button type="submit" loading={busy} className="w-full">
            Create
          </Button>
        </div>
      </form>
      {loading ? (
        <LoadingSpinner label="Loading…" />
      ) : error ? (
        <ErrorState title="Unavailable" description={error} />
      ) : rows.length === 0 ? (
        <EmptyState title="No subcategories" description="Create one to begin." />
      ) : (
        <ul className="list-none space-y-2 p-0">
          {rows.map((s) => (
            <li key={s.id} className="border border-border bg-surface px-3 py-2">
              <p className="type-label text-primary">{s.name}</p>
              <p className="type-caption text-text-muted">
                {s.category.name} · {s.slug} · {s.status} · {s.productCount} products
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
