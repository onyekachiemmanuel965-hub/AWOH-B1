"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useState, useTransition } from "react";
import { SearchInput } from "@/components/ui/search-input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import type { PublicCategory } from "@/lib/api";

export function CatalogFilters({
  categories,
}: {
  categories: PublicCategory[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [q, setQ] = useState(params.get("q") ?? "");

  const category = params.get("category") ?? "";
  const subcategory = params.get("subcategory") ?? "";
  const sort = params.get("sort") ?? "newest";
  const selected = categories.find((c) => c.slug === category);

  function update(next: Record<string, string | null>) {
    const sp = new URLSearchParams(params.toString());
    Object.entries(next).forEach(([key, value]) => {
      if (!value) sp.delete(key);
      else sp.set(key, value);
    });
    if ("category" in next) sp.delete("page");
    if ("subcategory" in next || "q" in next || "sort" in next) sp.delete("page");
    startTransition(() => {
      router.push(`${pathname}?${sp.toString()}`);
    });
  }

  return (
    <div className="space-y-4 rounded-md border border-border bg-surface p-4">
      <form
        className="flex flex-col gap-3 sm:flex-row"
        onSubmit={(e) => {
          e.preventDefault();
          update({ q: q.trim() || null });
        }}
      >
        <SearchInput
          id="catalog-search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search materials…"
          className="flex-1"
        />
        <Button type="submit" disabled={pending}>
          Search
        </Button>
        {(params.get("q") || category || subcategory) && (
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              setQ("");
              startTransition(() => router.push(pathname));
            }}
          >
            Reset
          </Button>
        )}
      </form>

      <div className="grid gap-3 sm:grid-cols-3">
        <Select
          id="filter-category"
          label="Category"
          value={category}
          onChange={(e) =>
            update({
              category: e.target.value || null,
              subcategory: null,
            })
          }
          options={[
            { value: "", label: "All categories" },
            ...categories.map((c) => ({ value: c.slug, label: c.name })),
          ]}
        />
        <Select
          id="filter-subcategory"
          label="Subcategory"
          value={subcategory}
          onChange={(e) => update({ subcategory: e.target.value || null })}
          options={[
            { value: "", label: "All subcategories" },
            ...(selected?.subcategories ?? []).map((s) => ({
              value: s.slug,
              label: s.name,
            })),
          ]}
        />
        <Select
          id="filter-sort"
          label="Sort"
          value={sort}
          onChange={(e) => update({ sort: e.target.value })}
          options={[
            { value: "newest", label: "Newest" },
            { value: "name_asc", label: "Name A–Z" },
            { value: "name_desc", label: "Name Z–A" },
            { value: "price_asc", label: "Price low–high" },
            { value: "price_desc", label: "Price high–low" },
          ]}
        />
      </div>
      {pending ? (
        <p className="type-caption text-text-muted" aria-live="polite">
          Updating catalog…
        </p>
      ) : null}
    </div>
  );
}
