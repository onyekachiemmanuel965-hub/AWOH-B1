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
  fetchOrder,
  initializePayment,
  receiptDownloadUrl,
  verifyPayment,
  type PublicOrder,
} from "@/lib/orders-api";

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

  async function onPay() {
    if (!order) return;
    setBusy(true);
    try {
      const init = await initializePayment(order.id);
      if (init.provider === "mock") {
        const verified = await verifyPayment(order.id, init.reference);
        setOrder(verified.order);
        push({ title: "Mock payment verified", tone: "success" });
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

  async function onVerify() {
    if (!order) return;
    setBusy(true);
    try {
      const verified = await verifyPayment(
        order.id,
        order.payment?.providerReference ?? undefined,
      );
      setOrder(verified.order);
      push({ title: "Payment status refreshed", tone: "success" });
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

                {order.deliveryMessage ? (
                  <div className="border border-border bg-surface-muted p-4 space-y-2">
                    <p className="type-label text-primary">Delivery</p>
                    <p className="type-body-sm text-text">
                      {order.fulfillmentMethod === "PICKUP"
                        ? "Pickup"
                        : "Delivery"}
                    </p>
                    <p className="type-body-sm text-text">
                      {order.fulfillmentMethod === "PICKUP"
                        ? "Delivery fee: Not applicable"
                        : order.deliveryFee != null
                          ? `Delivery fee confirmed: ${formatMoney(order.deliveryFee, order.currency)}`
                          : "Delivery fee requires discussion."}
                    </p>
                    <p className="type-body-sm text-text-muted">
                      {order.deliveryMessage}
                    </p>
                  </div>
                ) : null}

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
                  <p className="mt-3 type-body-sm text-text-muted">
                    Subtotal {formatMoney(order.subtotal, order.currency)}
                    {order.deliveryFee != null
                      ? ` · Delivery ${formatMoney(order.deliveryFee, order.currency)}`
                      : ""}
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  {order.paymentAllowed &&
                  order.payment?.method === "PAYSTACK" &&
                  order.status !== "PAID" ? (
                    <Button onClick={onPay} loading={busy}>
                      Pay with Paystack
                    </Button>
                  ) : null}
                  {order.payment?.method === "PAYSTACK" &&
                  order.status !== "PAID" ? (
                    <Button variant="outline" onClick={onVerify} loading={busy}>
                      Refresh payment status
                    </Button>
                  ) : null}
                  {order.receiptAvailable ? (
                    <a
                      href={receiptDownloadUrl(order.id)}
                      className="inline-flex h-11 items-center justify-center rounded-md border border-border bg-surface px-5 type-button text-primary no-underline"
                    >
                      Download receipt
                    </a>
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
