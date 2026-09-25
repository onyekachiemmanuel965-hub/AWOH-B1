"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ErrorState,
  LoadingSpinner,
} from "@/components/feedback/feedback";
import {
  fetchDashboard,
  fetchMyAdminAccess,
  type DashboardStats,
  type MyAdminAccess,
} from "@/lib/admin-api";
import { formatMoney } from "@/lib/money";
import { useAuth } from "@/components/auth/auth-provider";

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardStats | null>(null);
  const [access, setAccess] = useState<MyAdminAccess | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [stats, myAccess] = await Promise.all([
          fetchDashboard(),
          fetchMyAdminAccess(),
        ]);
        if (!cancelled) {
          setData(stats);
          setAccess(myAccess);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to load dashboard.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) return <LoadingSpinner label="Loading dashboard…" />;
  if (error || !data) {
    return (
      <ErrorState title="Dashboard unavailable" description={error ?? "Error"} />
    );
  }

  const cards = [
    { label: "Orders", value: data.totals.orders },
    { label: "Pending payment", value: data.totals.pendingPayment },
    { label: "Awaiting offline", value: data.totals.awaitingOffline },
    { label: "Delivery negotiation", value: data.totals.awaitingDelivery },
    { label: "Paid", value: data.totals.paid },
    { label: "Payment failed", value: data.totals.paymentFailed },
    { label: "Products", value: data.totals.products },
    { label: "Low stock", value: data.totals.lowStock },
    { label: "Out of stock", value: data.totals.outOfStock },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="type-h2 text-primary">
          Welcome back
          {user?.firstName ? `, ${user.firstName}` : ""}
        </h1>
        <p className="mt-1 type-body-sm text-text-muted">
          Server-authoritative operational overview.
        </p>
      </div>

      {access ? (
        <section className="border border-border bg-surface p-5 space-y-4">
          <div>
            <p className="type-caption uppercase tracking-[0.14em] text-accent">
              My role
            </p>
            <p className="mt-1 type-h3 text-primary">{access.roleLabel}</p>
          </div>
          <div>
            <p className="type-caption uppercase tracking-[0.14em] text-accent">
              Your access
            </p>
            <p className="mt-1 type-body-sm text-text-muted">
              Modules the administrator has assigned to your account.
            </p>
            <ul className="mt-3 flex flex-wrap gap-2 list-none p-0">
              {access.modules.map((m) => (
                <li key={m.key}>
                  <Link
                    href={m.href}
                    className="inline-flex border border-border bg-background px-3 py-1.5 type-caption text-primary no-underline hover:border-border-strong"
                  >
                    {m.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => (
          <div key={c.label} className="border border-border bg-surface p-4">
            <p className="type-caption text-text-muted">{c.label}</p>
            <p className="mt-1 type-h3 text-primary">{c.value}</p>
          </div>
        ))}
      </div>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="type-h3 text-primary">Recent orders</h2>
          <Link href="/admin/orders" className="type-caption text-accent">
            View all
          </Link>
        </div>
        <div className="overflow-x-auto border border-border">
          <table className="w-full min-w-[640px] border-collapse text-left">
            <thead className="bg-surface-muted">
              <tr>
                <th className="px-3 py-2 type-caption">Order</th>
                <th className="px-3 py-2 type-caption">Customer</th>
                <th className="px-3 py-2 type-caption">Status</th>
                <th className="px-3 py-2 type-caption">Delivery</th>
                <th className="px-3 py-2 type-caption">Total</th>
              </tr>
            </thead>
            <tbody>
              {data.recentOrders.map((o) => (
                <tr key={o.id} className="border-t border-border">
                  <td className="px-3 py-2 type-body-sm">
                    <Link href={`/admin/orders/${o.id}`} className="text-primary">
                      {o.orderNumber}
                    </Link>
                  </td>
                  <td className="px-3 py-2 type-body-sm">{o.customer.email}</td>
                  <td className="px-3 py-2 type-body-sm">{o.status}</td>
                  <td className="px-3 py-2 type-body-sm">{o.deliveryFeeStatus}</td>
                  <td className="px-3 py-2 type-body-sm">
                    {formatMoney(o.total, o.currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="mb-3 type-h3 text-primary">Recent activity</h2>
        <ul className="space-y-2 list-none p-0">
          {data.recentActivity.map((a) => (
            <li
              key={a.id}
              className="border border-border bg-surface px-3 py-2 type-body-sm"
            >
              <span className="text-primary">{a.action}</span>
              <span className="text-text-muted">
                {" "}
                · {a.entityType} {a.entityId.slice(0, 8)}… ·{" "}
                {new Date(a.createdAt).toLocaleString()}
              </span>
            </li>
          ))}
          {data.recentActivity.length === 0 ? (
            <li className="type-body-sm text-text-muted">
              No recent audit events.
            </li>
          ) : null}
        </ul>
      </section>
    </div>
  );
}
