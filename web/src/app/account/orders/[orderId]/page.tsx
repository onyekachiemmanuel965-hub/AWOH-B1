"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { SiteHeader } from "@/components/navigation/site-header";
import { SiteFooter } from "@/components/navigation/site-footer";
import { Container, Section } from "@/components/layout/primitives";
import { Button } from "@/components/ui/button";
import {
  ErrorState,
  LoadingSpinner,
} from "@/components/feedback/feedback";
import { useAuth } from "@/components/auth/auth-provider";
import { useToast } from "@/components/feedback/toast";
import { formatMoney } from "@/lib/money";
import {
  acceptDeliveryQuote,
  downloadReceiptPdf,
  fetchOrder,
  initializePayment,
  updateDeliveryAddress,
  verifyPayment,
  type DeliveryQuoteStatus,
  type PublicOrder,
} from "@/lib/orders-api";
import {
  fetchLgas,
  fetchStates,
  fetchTowns,
  type LocationOption,
} from "@/lib/locations-api";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

function quoteHeadline(status: DeliveryQuoteStatus | undefined): string {
  switch (status) {
    case "DELIVERY_QUOTE_AVAILABLE":
      return "Delivery quote ready";
    case "DELIVERY_QUOTE_UPDATED":
      return "Delivery quote updated";
    case "DELIVERY_QUOTE_CONFIRMED":
      return "Delivery quote confirmed";
    case "DELIVERY_QUOTE_EXPIRED":
      return "Delivery quote expired";
    case "DELIVERY_QUOTE_PENDING":
      return "Delivery quote pending";
    case "DELIVERY_QUOTE_REQUIRED":
    default:
      return "Delivery quote required";
  }
}

function DeliveryQuoteGate({
  order,
  busy,
  onConfirm,
  onPay,
}: {
  order: PublicOrder;
  busy: boolean;
  onConfirm: () => void;
  onPay: () => void;
}) {
  const status = order.deliveryQuoteStatus;
  const needsContact =
    status === "DELIVERY_QUOTE_REQUIRED" ||
    status === "DELIVERY_QUOTE_PENDING" ||
    status === "DELIVERY_QUOTE_EXPIRED" ||
    (!status && order.deliveryFee == null);
  const needsConfirm =
    status === "DELIVERY_QUOTE_AVAILABLE" ||
    status === "DELIVERY_QUOTE_UPDATED";
  const confirmed = status === "DELIVERY_QUOTE_CONFIRMED";

  return (
    <section className="relative overflow-hidden border border-border bg-primary text-text-inverse">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.12]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 18% 20%, var(--color-accent) 0%, transparent 42%), linear-gradient(135deg, transparent 40%, rgba(255,255,255,0.08) 100%)",
        }}
        aria-hidden
      />
      <div className="relative space-y-5 p-6 sm:p-8">
        <p className="type-caption uppercase tracking-[0.18em] text-accent">
          Checkout gate
        </p>
        <h2 className="type-h2 text-text-inverse">
          {quoteHeadline(status)}
        </h2>
        <p className="max-w-xl type-body text-text-inverse/90">
          {order.deliveryMessage ??
            "Please contact our Sales Staff for your delivery quote."}
        </p>

        {order.deliveryAddress ? (
          <div className="border-t border-text-inverse/20 pt-4 type-body-sm text-text-inverse/90">
            <p className="type-caption uppercase tracking-[0.14em] text-accent mb-2">
              Delivery address
            </p>
            <p>
              <span className="text-text-inverse/60">State: </span>
              {order.deliveryAddress.state || "—"}
            </p>
            <p>
              <span className="text-text-inverse/60">LGA: </span>
              {order.deliveryAddress.lga || "—"}
            </p>
            <p>
              <span className="text-text-inverse/60">Town/City: </span>
              {order.deliveryAddress.townCity || "—"}
            </p>
            <p>
              <span className="text-text-inverse/60">Address: </span>
              {order.deliveryAddress.address || "—"}
            </p>
            {order.deliveryAddress.deliveryInstructions ? (
              <p className="text-text-inverse/70 mt-1">
                Instructions: {order.deliveryAddress.deliveryInstructions}
              </p>
            ) : null}
          </div>
        ) : null}

        {(needsConfirm || confirmed) && order.deliveryFee != null ? (
          <dl className="grid gap-3 sm:grid-cols-3 border-t border-text-inverse/20 pt-4">
            <div>
              <dt className="type-caption text-text-inverse/70">
                Delivery fee
              </dt>
              <dd className="type-label text-text-inverse">
                {formatMoney(order.deliveryFee, order.currency)}
              </dd>
            </div>
            <div>
              <dt className="type-caption text-text-inverse/70">
                Product subtotal
              </dt>
              <dd className="type-label text-text-inverse">
                {formatMoney(order.subtotal, order.currency)}
              </dd>
            </div>
            <div>
              <dt className="type-caption text-text-inverse/70">
                {confirmed ? "Total" : "Updated total"}
              </dt>
              <dd className="type-label text-text-inverse">
                {order.total
                  ? formatMoney(order.total, order.currency)
                  : "—"}
              </dd>
            </div>
          </dl>
        ) : null}

        <div className="flex flex-wrap gap-3 pt-2">
          {needsContact ? (
            <Link
              href="/contact"
              className="inline-flex h-11 items-center justify-center rounded-md bg-accent px-5 type-button text-primary no-underline"
            >
              Contact Sales Staff
            </Link>
          ) : null}
          {needsConfirm ? (
            <Button
              onClick={onConfirm}
              loading={busy}
              className="!bg-accent !text-primary hover:!opacity-90"
            >
              Confirm Delivery Quote
            </Button>
          ) : null}
          {order.payment?.method === "PAYSTACK" && order.status !== "PAID" ? (
            <Button
              onClick={onPay}
              loading={busy}
              disabled={!order.paymentAllowed}
              variant={order.paymentAllowed ? "primary" : "outline"}
              className={
                order.paymentAllowed
                  ? "!bg-accent !text-primary"
                  : "!border-text-inverse/40 !text-text-inverse/50"
              }
            >
              Pay Now
            </Button>
          ) : null}
        </div>

        {!order.paymentAllowed ? (
          <p className="type-caption text-text-inverse/70">
            {needsConfirm
              ? "Payment is unavailable until you confirm this delivery quote."
              : confirmed
                ? "Payment will become available when all other payment requirements are met."
                : "Payment is currently unavailable until your delivery quote is confirmed."}
          </p>
        ) : (
          <p className="type-caption text-text-inverse/70">
            Delivery quote confirmed. You can proceed with payment.
          </p>
        )}
      </div>
    </section>
  );
}

function OrderDetailInner() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams<{ orderId: string }>();
  const search = useSearchParams();
  const { push } = useToast();
  const orderId = params.orderId;

  const [order, setOrder] = useState<PublicOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [editingAddress, setEditingAddress] = useState(false);
  const [states, setStates] = useState<LocationOption[]>([]);
  const [lgas, setLgas] = useState<LocationOption[]>([]);
  const [towns, setTowns] = useState<LocationOption[]>([]);
  const [stateId, setStateId] = useState("");
  const [lgaId, setLgaId] = useState("");
  const [townId, setTownId] = useState("");
  const [line1, setLine1] = useState("");
  const [notes, setNotes] = useState("");
  const [loadingLgas, setLoadingLgas] = useState(false);
  const [loadingTowns, setLoadingTowns] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace(`/login?next=/account/orders/${orderId}`);
    }
  }, [authLoading, user, router, orderId]);

  useEffect(() => {
    if (!user || !orderId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const reference = search.get("reference");
        const mock = search.get("mock");
        if (reference && (mock === "1" || search.get("pay") === "1")) {
          try {
            const verified = await verifyPayment(orderId, reference);
            if (!cancelled) {
              setOrder(verified.order);
              push({
                title: verified.alreadyProcessed
                  ? "Payment already confirmed"
                  : "Payment confirmed",
                tone: "success",
              });
            }
          } catch {
            const data = await fetchOrder(orderId);
            if (!cancelled) setOrder(data);
          }
        } else {
          const data = await fetchOrder(orderId);
          if (!cancelled) setOrder(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Order not found.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, orderId, search, push]);

  useEffect(() => {
    if (!editingAddress) return;
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchStates();
        if (!cancelled) setStates(data);
      } catch {
        /* locations load failure surfaced on submit */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [editingAddress]);

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
        if (!cancelled) setLgas(data);
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
        if (!cancelled) setTowns(data);
      } finally {
        if (!cancelled) setLoadingTowns(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [lgaId]);

  async function onPay() {
    if (!order) return;
    setBusy(true);
    try {
      const init = await initializePayment(order.id);
      if (init.provider === "mock") {
        const verified = await verifyPayment(order.id, init.reference);
        setOrder(verified.order);
        push({
          title: "Payment confirmed",
          description: verified.order.receiptAvailable
            ? "Your PDF receipt was generated and emailed to your order contact address. You can also download it below."
            : "Payment verified. Your PDF receipt will appear shortly.",
          tone: "success",
        });
        return;
      }
      window.location.href = init.authorizationUrl;
    } catch (err) {
      push({
        title: "Payment unavailable",
        description: err instanceof Error ? err.message : undefined,
        tone: "error",
      });
    } finally {
      setBusy(false);
    }
  }

  async function onConfirmQuote() {
    if (!order) return;
    setBusy(true);
    try {
      const updated = await acceptDeliveryQuote(order.id);
      setOrder(updated);
      push({ title: "Delivery quote confirmed", tone: "success" });
    } catch (err) {
      push({
        title: "Could not confirm quote",
        description: err instanceof Error ? err.message : undefined,
        tone: "error",
      });
      try {
        const refreshed = await fetchOrder(order.id);
        setOrder(refreshed);
      } catch {
        /* ignore refresh failure */
      }
    } finally {
      setBusy(false);
    }
  }

  async function onSaveAddress() {
    if (!order) return;
    if (!stateId || !lgaId || !townId || line1.trim().length < 3) {
      push({
        title: "Complete the delivery address",
        description: "State, LGA, Town/City, and street address are required.",
        tone: "error",
      });
      return;
    }
    setBusy(true);
    try {
      const updated = await updateDeliveryAddress(order.id, {
        shippingStateId: stateId,
        shippingLgaId: lgaId,
        shippingTownId: townId,
        shippingLine1: line1.trim(),
        shippingNotes: notes.trim() || undefined,
      });
      setOrder(updated);
      setEditingAddress(false);
      push({
        title: "Delivery address updated",
        description:
          "Previous delivery quote was cleared. Contact Sales Staff for a new quote.",
        tone: "success",
      });
    } catch (err) {
      push({
        title: "Could not update address",
        description: err instanceof Error ? err.message : undefined,
        tone: "error",
      });
    } finally {
      setBusy(false);
    }
  }

  async function onVerify() {
    if (!order) return;
    setBusy(true);
    try {
      const verified = await verifyPayment(
        order.id,
        order.payment?.providerReference ?? undefined,
      );
      setOrder(verified.order);
      push({
        title:
          verified.order.status === "PAID"
            ? "Payment confirmed"
            : "Payment status refreshed",
        description:
          verified.order.status === "PAID" && verified.order.receiptAvailable
            ? "Your PDF receipt was emailed to your order contact address. You can download the same PDF below."
            : undefined,
        tone: "success",
      });
    } catch (err) {
      push({
        title: "Verification failed",
        description: err instanceof Error ? err.message : undefined,
        tone: "error",
      });
    } finally {
      setBusy(false);
    }
  }

  async function onDownloadReceipt() {
    if (!order) return;
    setBusy(true);
    try {
      await downloadReceiptPdf(order.id, order.orderNumber);
      push({
        title: "Receipt PDF downloaded",
        tone: "success",
      });
    } catch (err) {
      push({
        title: "Download failed",
        description: err instanceof Error ? err.message : undefined,
        tone: "error",
      });
    } finally {
      setBusy(false);
    }
  }

  const showDeliveryGate =
    order &&
    order.fulfillmentMethod === "DELIVERY" &&
    order.status !== "PAID" &&
    order.status !== "CANCELLED";

  return (
    <>
      <SiteHeader />
      <main id="main-content">
        <Section className="!py-12">
          <Container className="max-w-3xl space-y-8">
            <div>
              <Link
                href="/account/orders"
                className="type-caption text-text-muted hover:text-primary"
              >
                ← All orders
              </Link>
              <h1 className="mt-3 type-h1 text-primary">
                {order?.orderNumber ?? "Order"}
              </h1>
            </div>

            {authLoading || loading ? (
              <LoadingSpinner label="Loading order…" />
            ) : error || !order ? (
              <ErrorState
                title="Order unavailable"
                description={error ?? "Order not found."}
              />
            ) : (
              <div className="space-y-6">
                {showDeliveryGate ? (
                  <DeliveryQuoteGate
                    order={order}
                    busy={busy}
                    onConfirm={() => void onConfirmQuote()}
                    onPay={() => void onPay()}
                  />
                ) : null}

                {showDeliveryGate ? (
                  <section className="border border-border bg-surface p-5 space-y-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h2 className="type-h3 text-primary">
                          Delivery destination
                        </h2>
                        <p className="mt-1 type-body-sm text-text-muted">
                          Changing your destination clears any existing delivery
                          quote. You will need a new quote from Sales Staff.
                        </p>
                      </div>
                      {!editingAddress ? (
                        <Button
                          variant="outline"
                          onClick={() => {
                            setEditingAddress(true);
                            setLine1(order.shippingLine1 ?? "");
                            setNotes(order.shippingNotes ?? "");
                            setStateId("");
                            setLgaId("");
                            setTownId("");
                          }}
                        >
                          Change address
                        </Button>
                      ) : null}
                    </div>

                    {!editingAddress && order.deliveryAddress ? (
                      <dl className="grid gap-2 type-body-sm sm:grid-cols-2">
                        <div>
                          <dt className="type-caption text-text-muted">State</dt>
                          <dd>{order.deliveryAddress.state || "—"}</dd>
                        </div>
                        <div>
                          <dt className="type-caption text-text-muted">LGA</dt>
                          <dd>{order.deliveryAddress.lga || "—"}</dd>
                        </div>
                        <div>
                          <dt className="type-caption text-text-muted">
                            Town / City
                          </dt>
                          <dd>{order.deliveryAddress.townCity || "—"}</dd>
                        </div>
                        <div>
                          <dt className="type-caption text-text-muted">
                            Address
                          </dt>
                          <dd>{order.deliveryAddress.address || "—"}</dd>
                        </div>
                        {order.deliveryAddress.deliveryInstructions ? (
                          <div className="sm:col-span-2">
                            <dt className="type-caption text-text-muted">
                              Instructions
                            </dt>
                            <dd>
                              {order.deliveryAddress.deliveryInstructions}
                            </dd>
                          </div>
                        ) : null}
                      </dl>
                    ) : null}

                    {editingAddress ? (
                      <div className="space-y-4">
                        <Select
                          id="order-state"
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
                          id="order-lga"
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
                        />
                        <Select
                          id="order-town"
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
                        />
                        <Input
                          id="order-line1"
                          label="Apartment / House / Street Address"
                          required
                          value={line1}
                          onChange={(e) => setLine1(e.target.value)}
                        />
                        <Input
                          id="order-notes"
                          label="Additional delivery instructions (optional)"
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                        />
                        <div className="flex flex-wrap gap-3">
                          <Button
                            onClick={() => void onSaveAddress()}
                            loading={busy}
                            disabled={
                              !stateId ||
                              !lgaId ||
                              !townId ||
                              line1.trim().length < 3
                            }
                          >
                            Request new delivery quote
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => setEditingAddress(false)}
                            disabled={busy}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : null}
                  </section>
                ) : null}

                <dl className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <dt className="type-caption text-text-muted">Status</dt>
                    <dd className="type-body text-primary">{order.status}</dd>
                  </div>
                  <div>
                    <dt className="type-caption text-text-muted">Fulfillment</dt>
                    <dd className="type-body text-primary">
                      {order.fulfillmentMethod}
                    </dd>
                  </div>
                  <div>
                    <dt className="type-caption text-text-muted">Payment</dt>
                    <dd className="type-body text-primary">
                      {order.payment
                        ? `${order.payment.method} · ${order.payment.status}`
                        : "—"}
                    </dd>
                  </div>
                  <div>
                    <dt className="type-caption text-text-muted">Total</dt>
                    <dd className="type-body text-primary">
                      {order.total
                        ? formatMoney(order.total, order.currency)
                        : "Pending delivery confirmation"}
                    </dd>
                  </div>
                </dl>

                <div>
                  <h2 className="type-h3 text-primary">Items</h2>
                  <ul className="mt-3 list-none space-y-2 p-0">
                    {order.items.map((item) => (
                      <li
                        key={item.id}
                        className="flex justify-between gap-3 type-body-sm"
                      >
                        <span>
                          {item.productName} × {item.quantity}
                        </span>
                        <span>
                          {formatMoney(item.lineTotal, order.currency)}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-4 space-y-1 border-t border-border pt-3 type-body-sm">
                    <p className="flex justify-between gap-3">
                      <span className="text-text-muted">Subtotal</span>
                      <span>
                        {formatMoney(order.subtotal, order.currency)}
                      </span>
                    </p>
                    {order.fulfillmentMethod === "DELIVERY" ? (
                      <p className="flex justify-between gap-3">
                        <span className="text-text-muted">Delivery</span>
                        <span>
                          {order.deliveryFee != null
                            ? formatMoney(order.deliveryFee, order.currency)
                            : "Pending sales quote"}
                        </span>
                      </p>
                    ) : null}
                    <p className="flex justify-between gap-3 type-label text-primary">
                      <span>Total</span>
                      <span>
                        {order.total
                          ? formatMoney(order.total, order.currency)
                          : "Pending delivery quote"}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  {!showDeliveryGate &&
                  order.paymentAllowed &&
                  order.payment?.method === "PAYSTACK" &&
                  order.status !== "PAID" ? (
                    <Button onClick={() => void onPay()} loading={busy}>
                      Pay Now
                    </Button>
                  ) : null}
                  {order.payment?.method === "PAYSTACK" &&
                  order.status !== "PAID" ? (
                    <Button
                      variant="outline"
                      onClick={() => void onVerify()}
                      loading={busy}
                    >
                      Refresh payment status
                    </Button>
                  ) : null}
                  {order.receiptAvailable ? (
                    <Button
                      variant="outline"
                      onClick={() => void onDownloadReceipt()}
                      loading={busy}
                    >
                      Download PDF receipt
                    </Button>
                  ) : null}
                </div>
              </div>
            )}
          </Container>
        </Section>
      </main>
      <SiteFooter />
    </>
  );
}

export default function OrderDetailPage() {
  return (
    <Suspense
      fallback={
        <>
          <SiteHeader />
          <main className="py-20">
            <Container>
              <LoadingSpinner label="Loading order…" />
            </Container>
          </main>
          <SiteFooter />
        </>
      }
    >
      <OrderDetailInner />
    </Suspense>
  );
}
