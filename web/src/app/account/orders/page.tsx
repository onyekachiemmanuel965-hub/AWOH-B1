"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SiteHeader } from "@/components/navigation/site-header";
import { SiteFooter } from "@/components/navigation/site-footer";
import { Container, Section } from "@/components/layout/primitives";
import {
  EmptyState,
  ErrorState,
  LoadingSpinner,
} from "@/components/feedback/feedback";
import { useAuth } from "@/components/auth/auth-provider";
import { fetchOrders, type PublicOrder } from "@/lib/orders-api";
import { formatMoney } from "@/lib/money";

export default function OrdersListPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<PublicOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login?next=/account/orders");
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const data = await fetchOrders();
        if (!cancelled) setOrders(data);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Unable to load orders.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  return (
    <>
      <SiteHeader />
      <main id="main-content">
        <Section className="!py-12">
          <Container className="space-y-8">
            <div>
              <p className="type-caption uppercase tracking-[0.16em] text-accent">
                Account
              </p>
              <h1 className="mt-2 type-h1 text-primary">Your orders</h1>
              <p className="mt-2 type-body text-text-muted">
                Order and payment status always come from the server.
              </p>
            </div>

            {authLoading || loading ? (
              <LoadingSpinner label="Loading orders…" />
            ) : error ? (
              <ErrorState title="Orders unavailable" description={error} />
            ) : orders.length === 0 ? (
              <EmptyState
                title="No orders yet"
                description="When you complete checkout, your orders will appear here."
                action={
                  <Link href="/products" className="type-label text-primary">
                    Browse collections
                  </Link>
                }
              />
            ) : (
              <ul className="list-none space-y-3 p-0">
                {orders.map((order) => (
                  <li key={order.id}>
                    <Link
                      href={`/account/orders/${order.id}`}
                      className="block border border-border bg-surface p-4 no-underline transition-colors hover:border-primary"
                    >
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <span className="type-h4 text-primary">
                          {order.orderNumber}
                        </span>
                        <span className="type-caption text-text-muted">
                          {order.status}
                        </span>
                      </div>
                      <p className="mt-1 type-body-sm text-text-muted">
                        {new Date(order.createdAt).toLocaleString()} ·{" "}
                        {order.fulfillmentMethod}
                        {order.total
                          ? ` · ${formatMoney(order.total, order.currency)}`
                          : ""}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Container>
        </Section>
      </main>
      <SiteFooter />
    </>
  );
}
