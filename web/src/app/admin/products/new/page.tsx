"use client";

import Image from "next/image";
import { FormEvent, useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/feedback/toast";
import {
  createAdminProduct,
  fetchAdminSubcategories,
  uploadProductImage,
} from "@/lib/admin-api";
import {
  TILE_SIZE_OPTIONS,
  getTileSize,
  type TileSizeCode,
  tileAspectRatioCss,
} from "@/lib/tile-size";

const PLACEHOLDER = "/images/placeholders/product-a.svg";

export default function NewProductPage() {
  const router = useRouter();
  const { push } = useToast();
  const fileInputId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [subs, setSubs] = useState<
    Array<{ id: string; name: string; category: { name: string } }>
  >([]);
  const [pending, setPending] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [tileSize, setTileSize] = useState<TileSizeCode | "">("");
  const [form, setForm] = useState({
    name: "",
    subcategoryId: "",
    description: "",
    price: "",
    stockQuantity: "0",
  });

  useEffect(() => {
    void fetchAdminSubcategories().then((rows) => setSubs(rows));
  }, []);

  useEffect(() => {
    if (selectedFiles.length === 0) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(selectedFiles[0]);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [selectedFiles]);

  function onFilesChosen(list: FileList | null) {
    if (!list || list.length === 0) {
      setSelectedFiles([]);
      return;
    }
    const images = Array.from(list).filter((f) =>
      ["image/jpeg", "image/png", "image/webp"].includes(f.type),
    );
    setSelectedFiles(images);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!tileSize) {
      push({
        title: "Tile size required",
        description: "Select a tile size before creating the product.",
        tone: "error",
      });
      return;
    }
    setPending(true);
    try {
      const product = await createAdminProduct({
        name: form.name,
        subcategoryId: form.subcategoryId,
        description: form.description,
        price: form.price,
        imageUrl: PLACEHOLDER,
        tileSize,
        stockQuantity: Number(form.stockQuantity) || 0,
      });

      for (const file of selectedFiles) {
        await uploadProductImage(product.id, file);
      }

      push({
        title: "Product created",
        description:
          selectedFiles.length > 0
            ? `${selectedFiles.length} image${selectedFiles.length === 1 ? "" : "s"} attached.`
            : undefined,
        tone: "success",
      });
      router.push(`/admin/products/${product.id}`);
    } catch (err) {
      push({
        title: "Create failed",
        description: err instanceof Error ? err.message : undefined,
        tone: "error",
      });
    } finally {
      setPending(false);
    }
  }

  const displaySrc = previewUrl ?? PLACEHOLDER;
  const aspect = tileAspectRatioCss(tileSize || null);
  const sizeLabel = tileSize ? getTileSize(tileSize)?.label : null;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="type-h2 text-primary">New product</h1>
      <form className="space-y-4" onSubmit={onSubmit}>
        <Input
          id="name"
          label="Name"
          required
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
        <label className="block">
          <span className="type-caption text-text-muted">Subcategory</span>
          <select
            required
            className="mt-1 w-full border border-border bg-surface px-3 py-2"
            value={form.subcategoryId}
            onChange={(e) => setForm({ ...form, subcategoryId: e.target.value })}
          >
            <option value="">Select…</option>
            {subs.map((s) => (
              <option key={s.id} value={s.id}>
                {s.category.name} / {s.name}
              </option>
            ))}
          </select>
        </label>
        <Textarea
          id="description"
          label="Description"
          required
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
        <Input
          id="price"
          label="Price (NGN)"
          required
          value={form.price}
          onChange={(e) => setForm({ ...form, price: e.target.value })}
        />

        <label className="block" htmlFor="tile-size">
          <span className="type-caption text-text-muted">Tile Size</span>
          <select
            id="tile-size"
            required
            className="mt-1 w-full border border-border bg-surface px-3 py-2"
            value={tileSize}
            onChange={(e) =>
              setTileSize(e.target.value as TileSizeCode | "")
            }
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
          <p className="type-caption text-text-muted">
            Product image
            {sizeLabel ? ` · ${sizeLabel}` : ""}
          </p>
          <div className="mt-2 overflow-hidden border border-border bg-surface">
            <div
              className="relative mx-auto w-full max-w-md bg-surface-muted"
              style={{ aspectRatio: aspect }}
            >
              <Image
                src={displaySrc}
                alt={
                  selectedFiles[0]
                    ? selectedFiles[0].name
                    : "Product image preview"
                }
                fill
                unoptimized
                className="object-contain"
                sizes="(max-width: 672px) 100vw, 448px"
              />
            </div>
            <div className="border-t border-border bg-surface p-3">
              <input
                ref={fileInputRef}
                id={fileInputId}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                className="sr-only"
                onChange={(e) => {
                  onFilesChosen(e.target.files);
                  e.target.value = "";
                }}
              />
              <Button
                type="button"
                variant="secondary"
                className="w-full"
                onClick={() => fileInputRef.current?.click()}
              >
                Choose files
              </Button>
              <p className="mt-2 type-caption text-text-muted">
                {selectedFiles.length > 0
                  ? `${selectedFiles.length} file${selectedFiles.length === 1 ? "" : "s"} selected — JPG, PNG, or WEBP.`
                  : "Preview uses the selected tile proportion. Images are never stretched."}
              </p>
            </div>
          </div>
        </div>

        <Input
          id="stock"
          label="Initial stock"
          value={form.stockQuantity}
          onChange={(e) => setForm({ ...form, stockQuantity: e.target.value })}
        />
        <Button type="submit" loading={pending}>
          Create product
        </Button>
      </form>
    </div>
  );
}
