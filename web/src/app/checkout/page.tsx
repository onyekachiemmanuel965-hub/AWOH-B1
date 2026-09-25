"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { SiteHeader } from "@/components/navigation/site-header";
import { SiteFooter } from "@/components/navigation/site-footer";
import { Container, Section } from "@/components/layout/primitives";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  EmptyState,
  ErrorState,
  LoadingSpinner,
} from "@/components/feedback/feedback";
import { useAuth } from "@/components/auth/auth-provider";
import { useCart } from "@/components/cart/cart-provider";
import { useToast } from "@/components/feedback/toast";
import { formatMoney } from "@/lib/money";
import { resolveProducts, type PublicProduct } from "@/lib/api";
import { createOrder, initializePayment } from "@/lib/orders-api";

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
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

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

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (items.length === 0) {
      setError("Your cart is empty.");
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
        shippingLine1: fulfillment === "DELIVERY" ? line1 : undefined,
        shippingCity: fulfillment === "DELIVERY" ? city : undefined,
        shippingState: fulfillment === "DELIVERY" ? state : undefined,
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

      push({ title: "Order placed", tone: "success" });
      router.push(`/account/orders/${order.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Checkout failed.");
    } finally {
      setPending(false);
    }
  }

  if (authLoading || (!user && !authLoading)) {
    return (
      <>
        <SiteHeader />
        <main id="main-content" className="py-20">
          <Container>
            <LoadingSpinner label="Preparing checkout…" />
          </Container>
        </main>
        <SiteFooter />
      </>
    );
  }

  return (
    <>
      <SiteHeader />
      <main id="main-content">
        <Section className="!py-12">
          <Container className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <p className="type-caption uppercase tracking-[0.16em] text-accent">
                Checkout
              </p>
              <h1 className="mt-2 type-h1 text-primary">Confirm your order</h1>
              <p className="mt-3 type-body text-text-muted">
                Prices are confirmed by the catalog service at order creation.
                Display totals below are illustrative until the order is placed.
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
                    {fulfillment === "DELIVERY" ? (
                      <p className="type-caption text-text-muted">
                        Delivery fees are calculated by AWOH-B after you place
                        the order. If discussion is required, payment stays
                        blocked until the fee is confirmed. Delivery fee:
                        calculated on the server.
                      </p>
                    ) : (
                      <p className="type-caption text-text-muted">
                        Pickup — delivery fee: not applicable.
                      </p>
                    )}
                  </fieldset>

                  <div className="grid gap-4 sm:grid-cols-2">
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
                    <div className="space-y-4">
                      <Input
                        id="checkout-line1"
                        label="Address"
                        autoComplete="street-address"
                        required
                        value={line1}
                        onChange={(e) => setLine1(e.target.value)}
                      />
                      <div className="grid gap-4 sm:grid-cols-2">
                        <Input
                          id="checkout-city"
                          label="City"
                          autoComplete="address-level2"
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                        />
                        <Input
                          id="checkout-state"
                          label="State"
                          autoComplete="address-level1"
                          value={state}
                          onChange={(e) => setState(e.target.value)}
                        />
                      </div>
                    </div>
                  ) : null}

                  <Input
                    id="checkout-notes"
                    label="Notes (optional)"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />

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

                  <Button type="submit" className="w-full" loading={pending}>
                    Place order
                  </Button>
                </form>
              )}
            </div>

            <aside className="border border-border bg-surface p-6">
              <h2 className="type-h3 text-primary">Order summary</h2>
              <ul className="mt-4 list-none space-y-3 p-0">
                {lines.map(({ line, product, lineTotal }) => (
                  <li key={line.productId} className="type-body-sm">
                    <div className="flex justify-between gap-3">
                      <span>
                        {product.name} × {line.quantity}
                      </span>
                      <span>{formatMoney(lineTotal, currency)}</span>
                    </div>
                  </li>
                ))}
              </ul>
              <div className="mt-6 border-t border-border pt-4">
                <p className="flex justify-between type-label">
                  <span>Estimated subtotal</span>
                  <span>{formatMoney(displaySubtotal, currency)}</span>
                </p>
                <p className="mt-2 type-caption text-text-muted">
                  {fulfillment === "PICKUP"
                    ? "Delivery fee: not applicable."
                    : "Delivery fee will be confirmed by the server after checkout. Pay only when the fee is approved."}
                </p>
                <p className="mt-2 type-caption text-text-muted">
                  Final totals are calculated by the server when you place the
                  order.
                </p>
              </div>
            </aside>
          </Container>
        </Section>
      </main>
      <SiteFooter />
    </>
  );
}
