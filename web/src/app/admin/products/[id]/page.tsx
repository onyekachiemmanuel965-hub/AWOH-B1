"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  ErrorState,
  LoadingSpinner,
} from "@/components/feedback/feedback";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/feedback/toast";
import { useAuth } from "@/components/auth/auth-provider";
import {
  deactivateProduct,
  fetchAdminProduct,
  mediaUrl,
  type StaffProduct,
  updateAdminProduct,
  updateInventory,
  updateProductPrice,
  uploadProductImage,
} from "@/lib/admin-api";
import {
  TILE_SIZE_OPTIONS,
  tileAspectRatioCss,
} from "@/lib/tile-size";

export default function AdminProductDetailPage() {
  const params = useParams<{ id: string }>();
  const { user } = useAuth();
  const { push } = useToast();
  const [product, setProduct] = useState<StaffProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [tileSize, setTileSize] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [weight, setWeight] = useState("");
  const [availability, setAvailability] = useState("AVAILABLE");

  const canContent =
    user?.role === "ADMIN" || user?.role === "CONTENT_MANAGER";
  const canInventory =
    user?.role === "ADMIN" || user?.role === "INVENTORY_MANAGER";
  const canPrice = user?.role === "ADMIN";
  const canEdit = canContent || canInventory || canPrice;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const p = await fetchAdminProduct(params.id);
      setProduct(p);
      setName(p.name);
      setDescription(p.description);
      setTileSize(p.tileSize ?? "");
      setPrice(p.price);
      setStock(String(p.stockQuantity ?? 0));
      setWeight(p.weightPerCartonKg ?? "");
      setAvailability(p.availability);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Not found");
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    if (!user) return;
    void load();
  }, [load, user]);

  async function saveContent(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await updateAdminProduct(params.id, { name, description, tileSize });
      push({ title: "Product updated", tone: "success" });
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

  async function savePrice(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await updateProductPrice(params.id, price);
      push({ title: "Price updated", tone: "success" });
      await load();
    } catch (err) {
      push({
        title: "Price update failed",
        description: err instanceof Error ? err.message : undefined,
        tone: "error",
      });
    } finally {
      setBusy(false);
    }
  }

  async function saveInventory(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await updateInventory(params.id, {
        stockQuantity: Number(stock),
        availability,
        weightPerCartonKg: weight === "" ? null : weight,
      });
      push({ title: "Inventory updated", tone: "success" });
      await load();
    } catch (err) {
      push({
        title: "Inventory update failed",
        description: err instanceof Error ? err.message : undefined,
        tone: "error",
      });
    } finally {
      setBusy(false);
    }
  }

  async function onUpload(file: File | null) {
    if (!file) return;
    setBusy(true);
    try {
      await uploadProductImage(params.id, file);
      push({ title: "Image uploaded", tone: "success" });
      await load();
    } catch (err) {
      push({
        title: "Upload failed",
        description: err instanceof Error ? err.message : undefined,
        tone: "error",
      });
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <LoadingSpinner label="Loading product…" />;
  if (error || !product) {
    return <ErrorState title="Product unavailable" description={error ?? ""} />;
  }

  return (
    <div className="space-y-8">
      <div>
        <Link href="/admin/products" className="type-caption text-text-muted">
          ← Products
        </Link>
        <h1 className="mt-2 type-h2 text-primary">{product.name}</h1>
        <p className="type-body-sm text-text-muted">{product.slug}</p>
      </div>

      <div className="flex flex-wrap gap-3">
        {product.images.map((img) => (
          <div
            key={img.id}
            className="relative overflow-hidden border border-border bg-surface-muted"
            style={{
              width: 96,
              aspectRatio: tileAspectRatioCss(
                tileSize || product.tileSize,
              ),
            }}
          >
            <Image
              src={mediaUrl(img.url)}
              alt={img.altText ?? product.name}
              fill
              className="object-contain"
              unoptimized={mediaUrl(img.url).startsWith("/images/")}
            />
          </div>
        ))}
      </div>
      {product.tileSizeLabel ? (
        <p className="type-body-sm text-text-muted">
          Tile Size: {product.tileSizeLabel}
        </p>
      ) : null}

      {!canEdit ? (
        <p className="border border-border bg-surface-muted px-4 py-3 type-body-sm text-text-muted">
          Read-only view. Your role can browse this product but cannot change
          content, price, or inventory. Ask an Admin, Content Manager, or
          Inventory Manager to make updates.
        </p>
      ) : null}

      {canContent ? (
        <form className="space-y-3 border border-border bg-surface p-4" onSubmit={saveContent}>
          <h2 className="type-h3 text-primary">Content</h2>
          <Input id="name" label="Name" value={name} onChange={(e) => setName(e.target.value)} />
          <Textarea
            id="desc"
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <label className="block" htmlFor="edit-tile-size">
            <span className="type-caption text-text-muted">Tile Size</span>
            <select
              id="edit-tile-size"
              required
              className="mt-1 w-full border border-border bg-surface px-3 py-2"
              value={tileSize}
              onChange={(e) => setTileSize(e.target.value)}
            >
              <option value="">Select tile size…</option>
              {TILE_SIZE_OPTIONS.map((opt) => (
                <option key={opt.code} value={opt.code}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>
          <div>
            <label className="type-caption text-text-muted">
              Add image (JPG/PNG/WEBP)
            </label>
            <div className="mt-2 overflow-hidden border border-border bg-surface">
              <div className="border-t-0 p-3">
                <input
                  id="product-image-file"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="sr-only"
                  onChange={(e) => {
                    void onUpload(e.target.files?.[0] ?? null);
                    e.target.value = "";
                  }}
                />
                <Button
                  type="button"
                  variant="secondary"
                  className="w-full"
                  onClick={() =>
                    document.getElementById("product-image-file")?.click()
                  }
                >
                  Choose files
                </Button>
                <p className="mt-2 type-caption text-text-muted">
                  Select a photo from your phone or computer.
                </p>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button type="submit" loading={busy}>
              Save content
            </Button>
            <Button
              type="button"
              variant="destructive"
              loading={busy}
              onClick={async () => {
                if (!confirm("Deactivate this product?")) return;
                setBusy(true);
                try {
                  await deactivateProduct(params.id);
                  push({ title: "Product deactivated", tone: "success" });
                  await load();
                } catch (err) {
                  push({
                    title: "Failed",
                    description: err instanceof Error ? err.message : undefined,
                    tone: "error",
                  });
                } finally {
                  setBusy(false);
                }
              }}
            >
              Deactivate
            </Button>
          </div>
        </form>
      ) : null}

      {canPrice ? (
        <form className="space-y-3 border border-border bg-surface p-4" onSubmit={savePrice}>
          <h2 className="type-h3 text-primary">Price (admin)</h2>
          <Input id="price" label="Price" value={price} onChange={(e) => setPrice(e.target.value)} />
          <Button type="submit" loading={busy}>
            Update price
          </Button>
        </form>
      ) : null}

      {canInventory ? (
        <form className="space-y-3 border border-border bg-surface p-4" onSubmit={saveInventory}>
          <h2 className="type-h3 text-primary">Stock &amp; availability</h2>
          <p className="type-body-sm text-text-muted">
            Restock quantity and mark the product Available or Unavailable for
            the storefront.
          </p>
          <Input id="stock" label="Stock quantity" value={stock} onChange={(e) => setStock(e.target.value)} />
          <label className="block" htmlFor="edit-availability">
            <span className="type-caption text-text-muted">Sell status</span>
            <select
              id="edit-availability"
              className="mt-1 w-full border border-border bg-surface px-3 py-2"
              value={availability}
              onChange={(e) => setAvailability(e.target.value)}
            >
              <option value="AVAILABLE">Available</option>
              <option value="UNAVAILABLE">Unavailable</option>
            </select>
          </label>
          <Input
            id="weight"
            label="Weight per carton (kg) — internal only"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
          />
          <Button type="submit" loading={busy}>
            Update inventory
          </Button>
        </form>
      ) : null}
    </div>
  );
}
