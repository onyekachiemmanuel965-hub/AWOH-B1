"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  ErrorState,
  LoadingSpinner,
  EmptyState,
} from "@/components/feedback/feedback";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/feedback/toast";
import { useAuth } from "@/components/auth/auth-provider";
import {
  createCategory,
  deactivateCategory,
  fetchAdminCategories,
} from "@/lib/admin-api";

export default function AdminCategoriesPage() {
  const { user } = useAuth();
  const { push } = useToast();
  const [rows, setRows] = useState<
    Array<{
      id: string;
      name: string;
      slug: string;
      status: string;
      subcategoryCount: number;
    }>
  >([]);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    setLoading(true);
    try {
      setRows(await fetchAdminCategories());
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
  }, [user]);

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await createCategory({ name });
      setName("");
      push({ title: "Category created", tone: "success" });
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
      <h1 className="type-h2 text-primary">Categories</h1>
      <form className="flex flex-wrap gap-2" onSubmit={onCreate}>
        <Input id="name" label="New category name" value={name} onChange={(e) => setName(e.target.value)} />
        <div className="flex items-end">
          <Button type="submit" loading={busy}>
            Create
          </Button>
        </div>
      </form>
      {loading ? (
        <LoadingSpinner label="Loading…" />
      ) : error ? (
        <ErrorState title="Unavailable" description={error} />
      ) : rows.length === 0 ? (
        <EmptyState title="No categories" description="Create one to begin." />
      ) : (
        <ul className="list-none space-y-2 p-0">
          {rows.map((c) => (
            <li
              key={c.id}
              className="flex flex-wrap items-center justify-between gap-2 border border-border bg-surface px-3 py-2"
            >
              <div>
                <p className="type-label text-primary">{c.name}</p>
                <p className="type-caption text-text-muted">
                  {c.slug} · {c.status} · {c.subcategoryCount} subcategories
                </p>
              </div>
              {c.status === "ACTIVE" ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={async () => {
                    if (!confirm("Deactivate category?")) return;
                    await deactivateCategory(c.id);
                    push({ title: "Deactivated", tone: "success" });
                    await load();
                  }}
                >
                  Deactivate
                </Button>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
