"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ErrorState,
  LoadingSpinner,
} from "@/components/feedback/feedback";
import { useAuth } from "@/components/auth/auth-provider";
import {
  clearStorefrontImage,
  fetchAdminStorefrontImages,
  fetchMyAdminAccess,
  mediaUrl,
  updateStorefrontImageAlt,
  uploadStorefrontImage,
  type AdminStorefrontImage,
  type MyAdminAccess,
} from "@/lib/admin-api";

const CMS_LINKS = [
  {
    href: "/admin/products",
    title: "Products",
    body: "Names, descriptions, images, tile size, and catalog presentation.",
  },
  {
    href: "/admin/categories",
    title: "Categories",
    body: "Top-level catalog groups (for example polished floor tiles).",
  },
  {
    href: "/admin/subcategories",
    title: "Subcategories",
    body: "Tile-size and subcategory organization under each category.",
  },
] as const;

const PAGE_LABELS: Record<string, string> = {
  home: "Home",
  about: "About",
  contact: "Contact",
  products: "Products",
  categories: "Categories",
};

function StorefrontImageCard({
  item,
  onChanged,
}: {
  item: AdminStorefrontImage;
  onChanged: (next: AdminStorefrontImage) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [alt, setAlt] = useState(item.altText);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setAlt(item.altText);
  }, [item.altText, item.key]);

  async function onFile(file: File | null) {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const next = await uploadStorefrontImage(item.key, file, alt);
      onChanged(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setBusy(false);
    }
  }

  async function onSaveAlt() {
    if (!item.isCustom) return;
    setBusy(true);
    setError(null);
    try {
      const next = await updateStorefrontImageAlt(item.key, alt);
      onChanged(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save alt text.");
    } finally {
      setBusy(false);
    }
  }

  async function onClear() {
    if (!item.isCustom) return;
    setBusy(true);
    setError(null);
    try {
      const next = await clearStorefrontImage(item.key);
      onChanged(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not clear image.");
    } finally {
      setBusy(false);
    }
  }

  const preview = mediaUrl(item.url);

  return (
    <article className="border border-border bg-surface p-4">
      <div className="relative aspect-[16/10] overflow-hidden border border-border bg-surface-muted">
        <Image
          src={preview}
          alt={item.altText}
          fill
          unoptimized
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 33vw"
        />
      </div>
      <h3 className="mt-3 type-h3 text-primary">{item.label}</h3>
      <p className="mt-1 type-caption text-text-muted">{item.description}</p>
      <p className="mt-2 type-caption text-accent">
        {item.isCustom ? "Custom upload" : "Using placeholder"}
      </p>
      <label className="mt-3 block type-caption text-text-muted">
        Alt text
        <input
          className="mt-1 w-full border border-border bg-background px-3 py-2 type-body-sm text-primary"
          value={alt}
          disabled={busy}
          onChange={(e) => setAlt(e.target.value)}
        />
      </label>
      <div className="mt-3 flex flex-wrap gap-2">
        <label className="inline-flex h-10 cursor-pointer items-center border border-primary bg-primary px-3 type-button text-text-inverse">
          {busy ? "Working…" : "Upload image"}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            disabled={busy}
            onChange={(e) => {
              void onFile(e.target.files?.[0] ?? null);
              e.target.value = "";
            }}
          />
        </label>
        {item.isCustom ? (
          <>
            <button
              type="button"
              className="h-10 border border-border-strong bg-surface px-3 type-button text-primary"
              disabled={busy}
              onClick={() => void onSaveAlt()}
            >
              Save alt
            </button>
            <button
              type="button"
              className="h-10 border border-border bg-transparent px-3 type-button text-text-muted"
              disabled={busy}
              onClick={() => void onClear()}
            >
              Revert to placeholder
            </button>
          </>
        ) : null}
      </div>
      {error ? (
        <p className="mt-2 type-caption text-danger" role="alert">
          {error}
        </p>
      ) : null}
    </article>
  );
}

export default function AdminCmsPage() {
  const { user } = useAuth();
  const [access, setAccess] = useState<MyAdminAccess | null>(null);
  const [images, setImages] = useState<AdminStorefrontImage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const canManageContent =
    user?.role === "ADMIN" || user?.role === "CONTENT_MANAGER";

  const load = useCallback(async () => {
    const data = await fetchMyAdminAccess();
    setAccess(data);
    if (canManageContent) {
      const slots = await fetchAdminStorefrontImages();
      setImages(slots);
    } else {
      setImages([]);
    }
  }, [canManageContent]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      try {
        await load();
        if (!cancelled) setError(null);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Unable to load CMS access.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, load]);

  const byPage = useMemo(() => {
    const map = new Map<string, AdminStorefrontImage[]>();
    for (const img of images) {
      const list = map.get(img.page) ?? [];
      list.push(img);
      map.set(img.page, list);
    }
    return map;
  }, [images]);

  if (loading) return <LoadingSpinner label="Loading CMS…" />;
  if (error) {
    return <ErrorState title="CMS unavailable" description={error} />;
  }

  const allowedHrefs = new Set((access?.nav ?? []).map((m) => m.href));
  const links = CMS_LINKS.filter((l) => allowedHrefs.has(l.href));

  return (
    <div className="space-y-10">
      <div>
        <h1 className="type-h2 text-primary">CMS</h1>
        <p className="mt-1 type-body-sm text-text-muted">
          Customer-facing catalog and storefront imagery. Content Manager and
          Admin can upload homepage and page banners (JPG, PNG, WEBP, max 5MB).
        </p>
      </div>

      {canManageContent ? (
        <section className="space-y-6" aria-labelledby="storefront-images-heading">
          <div>
            <h2 id="storefront-images-heading" className="type-h3 text-primary">
              Storefront &amp; page images
            </h2>
            <p className="mt-1 type-body-sm text-text-muted">
              Uploads replace placeholders on the live site. Clearing an image
              restores the built-in placeholder.
            </p>
          </div>
          {[...byPage.entries()].map(([page, items]) => (
            <div key={page} className="space-y-3">
              <h3 className="type-caption uppercase tracking-[0.14em] text-accent">
                {PAGE_LABELS[page] ?? page}
              </h3>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {items.map((item) => (
                  <StorefrontImageCard
                    key={item.key}
                    item={item}
                    onChanged={(next) =>
                      setImages((prev) =>
                        prev.map((p) => (p.key === next.key ? { ...p, ...next } : p)),
                      )
                    }
                  />
                ))}
              </div>
            </div>
          ))}
        </section>
      ) : null}

      <section className="space-y-4" aria-labelledby="catalog-cms-heading">
        <h2 id="catalog-cms-heading" className="type-h3 text-primary">
          Catalog content
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {links.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="border border-border bg-surface p-5 no-underline transition-colors hover:border-border-strong"
            >
              <p className="type-h3 text-primary">{item.title}</p>
              <p className="mt-2 type-body-sm text-text-muted">{item.body}</p>
            </Link>
          ))}
        </div>
        {links.length === 0 ? (
          <p className="type-body-sm text-text-muted">
            No CMS modules are assigned to this role.
          </p>
        ) : null}
      </section>
    </div>
  );
}
