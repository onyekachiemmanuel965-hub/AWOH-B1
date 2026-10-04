"use client";

import Link from "next/link";
import Image from "next/image";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { StorefrontShell } from "@/components/layout/storefront-shell";
import { Container, Section } from "@/components/layout/primitives";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  EmptyState,
  ErrorState,
  LoadingSpinner,
} from "@/components/feedback/feedback";
import { ImageZoomLightbox } from "@/components/product/image-zoom-lightbox";
import { useAuth } from "@/components/auth/auth-provider";
import { useCart } from "@/components/cart/cart-provider";
import { useToast } from "@/components/feedback/toast";
import { formatMoney } from "@/lib/money";
import { mediaUrl, resolveProducts, type PublicProduct } from "@/lib/api";
import { createOrder, initializePayment } from "@/lib/orders-api";
import {
  fetchLgas,
  fetchStates,
  fetchTowns,
  type LocationOption,
} from "@/lib/locations-api";

export default function CheckoutPage() {
  const { user, loading: authLoading } = useAuth();
  const { items, clear } = useCart();
  const { push } = useToast();
  const router = useRouter();

  const [products, setProducts] = useState<PublicProduct[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [fulfillment, setFulfillment] = useState<"PICKUP" | "DELIVERY">(
    "PICKUP",
  );
  const [paymentMethod, setPaymentMethod] = useState<"PAYSTACK" | "OFFLINE_CASH">(
    "PAYSTACK",
  );
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [line1, setLine1] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const [states, setStates] = useState<LocationOption[]>([]);
  const [lgas, setLgas] = useState<LocationOption[]>([]);
  const [towns, setTowns] = useState<LocationOption[]>([]);
  const [stateId, setStateId] = useState("");
  const [lgaId, setLgaId] = useState("");
  const [townId, setTownId] = useState("");
  const [loadingLgas, setLoadingLgas] = useState(false);
  const [loadingTowns, setLoadingTowns] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login?next=/checkout");
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (user?.email) setEmail(user.email);
  }, [user]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoadingProducts(true);
      try {
        const resolved = await resolveProducts(items.map((i) => i.productId));
        if (!cancelled) setProducts(resolved);
      } catch {
        if (!cancelled) setError("Unable to load cart products.");
      } finally {
        if (!cancelled) setLoadingProducts(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [items]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchStates();
        if (!cancelled) setStates(data);
      } catch {
        if (!cancelled) setLocationError("Unable to load Nigerian states.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!stateId) {
      setLgas([]);
      setLgaId("");
      setTowns([]);
      setTownId("");
      return;
    }
    let cancelled = false;
    setLoadingLgas(true);
    setLgaId("");
    setTownId("");
    setTowns([]);
    (async () => {
      try {
        const data = await fetchLgas(stateId);
        if (!cancelled) {
          setLgas(data);
          setLocationError(null);
        }
      } catch {
        if (!cancelled) setLocationError("Unable to load LGAs for this state.");
      } finally {
        if (!cancelled) setLoadingLgas(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [stateId]);

  useEffect(() => {
    if (!lgaId) {
      setTowns([]);
      setTownId("");
      return;
    }
    let cancelled = false;
    setLoadingTowns(true);
    setTownId("");
    (async () => {
      try {
        const data = await fetchTowns(lgaId);
        if (!cancelled) {
          setTowns(data);
          setLocationError(null);
        }
      } catch {
        if (!cancelled) {
          setLocationError("Unable to load towns/cities for this LGA.");
        }
      } finally {
        if (!cancelled) setLoadingTowns(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [lgaId]);

  const lines = useMemo(() => {
    return items
      .map((line) => {
        const product = products.find((p) => p.id === line.productId);
        if (!product) return null;
        return {
          line,
          product,
          unit: Number(product.price),
          lineTotal: Number(product.price) * line.quantity,
        };
      })
      .filter(Boolean) as Array<{
      line: { productId: string; quantity: number };
      product: PublicProduct;
      unit: number;
      lineTotal: number;
    }>;
  }, [items, products]);

  const displaySubtotal = lines.reduce((s, r) => s + r.lineTotal, 0);
  const currency = lines[0]?.product.currency ?? "NGN";

  const deliveryReady =
    fulfillment === "PICKUP" ||
    (Boolean(stateId) &&
      Boolean(lgaId) &&
      Boolean(townId) &&
      line1.trim().length >= 3);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (items.length === 0) {
      setError("Your cart is empty.");
      return;
    }
    if (fulfillment === "DELIVERY" && !deliveryReady) {
      setError(
        "Select State, LGA, Town/City, and enter your full street address.",
      );
      return;
    }
    setPending(true);
    try {
      const idempotencyKey =
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : `checkout-${Date.now()}`;

      const order = await createOrder({
        items: items.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
        })),
        fulfillmentMethod: fulfillment,
        paymentMethod,
        contactEmail: email,
        contactPhone: phone || undefined,
        shippingStateId: fulfillment === "DELIVERY" ? stateId : undefined,
        shippingLgaId: fulfillment === "DELIVERY" ? lgaId : undefined,
        shippingTownId: fulfillment === "DELIVERY" ? townId : undefined,
        shippingLine1: fulfillment === "DELIVERY" ? line1 : undefined,
        shippingNotes: notes || undefined,
        idempotencyKey,
      });

      clear();

      if (paymentMethod === "PAYSTACK" && order.paymentAllowed) {
        const init = await initializePayment(order.id);
        if (init.provider === "mock") {
          push({
            title: "Mock payment ready",
            description: "Complete verification on the order page.",
            tone: "info",
          });
          router.push(
            `/account/orders/${order.id}?reference=${encodeURIComponent(init.reference)}&mock=1`,
          );
          return;
        }
        window.location.href = init.authorizationUrl;
        return;
      }

      push({
        title:
          fulfillment === "DELIVERY"
            ? "Delivery quote requested"
            : "Order placed",
        description:
          fulfillment === "DELIVERY"
            ? "Contact Sales Staff to agree your delivery fee."
            : undefined,
        tone: "success",
      });
      router.push(`/account/orders/${order.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Checkout failed.");
    } finally {
      setPending(false);
    }
  }

  if (authLoading || (!user && !authLoading)) {
    return (
      <StorefrontShell atmosphere="marble" mainClassName="py-20">
        <Container>
          <LoadingSpinner label="Preparing checkout…" />
        </Container>
      </StorefrontShell>
    );
  }

  return (
    <StorefrontShell atmosphere="marble">
      <Section className="!py-12">
          <Container className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <p className="type-caption uppercase tracking-[0.16em] text-accent">
                Checkout
              </p>
              <h1 className="mt-2 type-h1 text-primary">Confirm your order</h1>
              <p className="mt-3 type-body text-text-muted">
                Prices are confirmed by the catalog service at order creation.
                Delivery fees are agreed with Sales Staff after you submit your
                destination.
              </p>

              {items.length === 0 ? (
                <EmptyState
                  className="mt-8"
                  title="Your cart is empty"
                  description="Add materials before checking out."
                  action={
                    <Link href="/products" className="type-label text-primary">
                      Browse collections
                    </Link>
                  }
                />
              ) : loadingProducts ? (
                <LoadingSpinner className="mt-8" label="Loading products…" />
              ) : error && lines.length === 0 ? (
                <ErrorState
                  className="mt-8"
                  title="Checkout unavailable"
                  description={error}
                />
              ) : (
                <form className="mt-8 space-y-6" onSubmit={onSubmit} noValidate>
                  <fieldset className="space-y-3">
                    <legend className="type-label text-primary">
                      Fulfillment
                    </legend>
                    <label className="flex items-center gap-2 type-body">
                      <input
                        type="radio"
                        name="fulfillment"
                        checked={fulfillment === "PICKUP"}
                        onChange={() => setFulfillment("PICKUP")}
                      />
                      Pickup
                    </label>
                    <label className="flex items-center gap-2 type-body">
                      <input
                        type="radio"
                        name="fulfillment"
                        checked={fulfillment === "DELIVERY"}
                        onChange={() => setFulfillment("DELIVERY")}
                      />
                      Delivery
                    </label>
                  </fieldset>

                  <div className="grid gap-4 md:grid-cols-2">
                    <Input
                      id="checkout-email"
                      label="Email"
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                    <Input
                      id="checkout-phone"
                      label="Phone"
                      type="tel"
                      autoComplete="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>

                  {fulfillment === "DELIVERY" ? (
                    <section
                      className="space-y-4 border border-border bg-surface-muted p-5"
                      aria-labelledby="delivery-address-heading"
                    >
                      <div>
                        <h2
                          id="delivery-address-heading"
                          className="type-h3 text-primary"
                        >
                          Delivery address
                        </h2>
                        <p className="mt-1 type-body-sm text-text-muted">
                          Select State → LGA → Town/City, then enter your street
                          address. Payment stays locked until Sales Staff enters
                          your delivery quote and you confirm it.
                        </p>
                      </div>

                      <Select
                        id="checkout-state"
                        label="State"
                        required
                        value={stateId}
                        onChange={(e) => setStateId(e.target.value)}
                        placeholder="Select State"
                        options={states.map((s) => ({
                          value: s.id,
                          label: s.name,
                        }))}
                      />

                      <Select
                        id="checkout-lga"
                        label="Local Government Area"
                        required
                        value={lgaId}
                        disabled={!stateId || loadingLgas}
                        onChange={(e) => setLgaId(e.target.value)}
                        placeholder={
                          loadingLgas ? "Loading LGAs…" : "Select LGA"
                        }
                        options={lgas.map((l) => ({
                          value: l.id,
                          label: l.name,
                        }))}
                        hint={
                          !stateId
                            ? "Select a state first."
                            : loadingLgas
                              ? "Loading…"
                              : undefined
                        }
                      />

                      <Select
                        id="checkout-town"
                        label="Town / City / Area"
                        required
                        value={townId}
                        disabled={!lgaId || loadingTowns}
                        onChange={(e) => setTownId(e.target.value)}
                        placeholder={
                          loadingTowns
                            ? "Loading towns/areas…"
                            : "Select Town / City / Area"
                        }
                        options={towns.map((t) => ({
                          value: t.id,
                          label: t.name,
                        }))}
                        hint={
                          !lgaId
                            ? "Select an LGA first."
                            : loadingTowns
                              ? "Loading…"
                              : undefined
                        }
                      />

                      <Input
                        id="checkout-line1"
                        label="Apartment / House / Street Address"
                        autoComplete="street-address"
                        required
                        value={line1}
                        onChange={(e) => setLine1(e.target.value)}
                      />

                      <Input
                        id="checkout-notes"
                        label="Additional delivery instructions (optional)"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        hint="Landmark, estate, gate colour, etc."
                      />

                      {locationError ? (
                        <p className="type-caption text-error" role="alert">
                          {locationError}
                        </p>
                      ) : null}
                    </section>
                  ) : (
                    <p className="type-caption text-text-muted">
                      Pickup — delivery fee: not applicable. You can pay online
                      right after placing the order.
                    </p>
                  )}

                  <fieldset className="space-y-3">
                    <legend className="type-label text-primary">
                      Payment method
                    </legend>
                    <label className="flex items-center gap-2 type-body">
                      <input
                        type="radio"
                        name="pay"
                        checked={paymentMethod === "PAYSTACK"}
                        onChange={() => setPaymentMethod("PAYSTACK")}
                      />
                      Pay online (Paystack)
                    </label>
                    <label className="flex items-center gap-2 type-body">
                      <input
                        type="radio"
                        name="pay"
                        checked={paymentMethod === "OFFLINE_CASH"}
                        onChange={() => setPaymentMethod("OFFLINE_CASH")}
                      />
                      Offline / cash (awaits confirmation)
                    </label>
                  </fieldset>

                  {error ? (
                    <p className="type-caption text-error" role="alert">
                      {error}
                    </p>
                  ) : null}

                  <Button
                    type="submit"
                    className="w-full"
                    loading={pending}
                    disabled={!deliveryReady}
                  >
                    {fulfillment === "DELIVERY"
                      ? "Request Delivery Quote"
                      : "Place order"}
                  </Button>
                </form>
              )}
            </div>

            <aside className="border border-border bg-surface p-6">
              <h2 className="type-h3 text-primary">Order summary</h2>
              <ul className="mt-4 list-none space-y-4 p-0">
                {lines.map(({ line, product, lineTotal }) => {
                  const imgSrc = product.primaryImage
                    ? mediaUrl(product.primaryImage)
                    : "";
                  return (
                    <li
                      key={line.productId}
                      className="grid grid-cols-[4.5rem_1fr] gap-3 type-body-sm"
                    >
                      {imgSrc ? (
                        <ImageZoomLightbox
                          src={imgSrc}
                          alt={product.images[0]?.altText ?? product.name}
                          hint="Zoom"
                          className="shrink-0"
                        >
                          <span className="relative block aspect-square overflow-hidden border border-border bg-surface-muted">
                            <Image
                              src={imgSrc}
                              alt={product.images[0]?.altText ?? product.name}
                              fill
                              unoptimized={product.primaryImage?.endsWith(
                                ".svg",
                              )}
                              className="object-cover"
                              sizes="72px"
                            />
                          </span>
                        </ImageZoomLightbox>
                      ) : (
                        <span className="aspect-square border border-border bg-surface-muted" />
                      )}
                      <div className="min-w-0 space-y-1">
                        <div className="flex justify-between gap-3">
                          <span className="truncate font-medium text-primary">
                            {product.name} × {line.quantity}
                          </span>
                          <span className="shrink-0">
                            {formatMoney(lineTotal, currency)}
                          </span>
                        </div>
                        {product.tileSizeLabel ? (
                          <p className="type-caption text-text-muted">
                            {product.tileSizeLabel}
                          </p>
                        ) : null}
                        <p className="type-caption text-text-muted">
                          Tap image to inspect
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
              <div className="mt-6 border-t border-border pt-4">
                <p className="flex justify-between type-label">
                  <span>Estimated subtotal</span>
                  <span>{formatMoney(displaySubtotal, currency)}</span>
                </p>
                {fulfillment === "PICKUP" ? (
                  <p className="mt-2 type-caption text-text-muted">
                    Delivery fee: not applicable.
                  </p>
                ) : (
                  <div className="mt-3 space-y-1 border border-border bg-surface-muted p-3">
                    <p className="type-label text-primary">
                      Delivery: pending sales quote
                    </p>
                    <p className="type-caption text-text-muted">
                      After you request a quote, contact Sales Staff. Pay online
                      only after you confirm the agreed fee on your order page.
                    </p>
                  </div>
                )}
              </div>
            </aside>
          </Container>
        </Section>
    </StorefrontShell>
  );
}
