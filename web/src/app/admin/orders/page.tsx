"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  EmptyState,
  ErrorState,
  LoadingSpinner,
} from "@/components/feedback/feedback";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/auth/auth-provider";
import { fetchAdminOrders, type StaffOrder } from "@/lib/admin-api";
import { formatMoney } from "@/lib/money";

export default function AdminOrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<StaffOrder[]>([]);
  const [meta, setMeta] = useState({ page: 1, total: 0, totalPages: 1 });
  const [status, setStatus] = useState("");
  const [delivery, setDelivery] = useState("");
  const [fulfillment, setFulfillment] = useState("");
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load(page = 1) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchAdminOrders({
        page,
        limit: 20,
        status: status || undefined,
        deliveryFeeStatus: delivery || undefined,
        fulfillmentMethod: fulfillment || undefined,
        q: q || undefined,
      });
      setOrders(res.data);
      setMeta(res.meta);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load orders.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!user) return;
    void load(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="type-h2 text-primary">Orders</h1>
        <p className="mt-1 type-body-sm text-text-muted">
          Operational order list with delivery and payment status.
        </p>
      </div>

      <form
        className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5"
        onSubmit={(e) => {
          e.preventDefault();
          void load(1);
        }}
      >
        <Input id="q" label="Search" value={q} onChange={(e) => setQ(e.target.value)} />
        <label className="block">
          <span className="type-caption text-text-muted">Status</span>
          <select
            className="mt-1 w-full border border-border bg-surface px-3 py-2"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="">All</option>
            <option value="PENDING_PAYMENT">Pending payment</option>
            <option value="AWAITING_OFFLINE_PAYMENT">Awaiting offline</option>
            <option value="AWAITING_DELIVERY_CONFIRMATION">Awaiting delivery</option>
            <option value="PAID">Paid</option>
            <option value="PAYMENT_FAILED">Payment failed</option>
          </select>
        </label>
        <label className="block">
          <span className="type-caption text-text-muted">Delivery</span>
          <select
            className="mt-1 w-full border border-border bg-surface px-3 py-2"
            value={delivery}
            onChange={(e) => setDelivery(e.target.value)}
          >
            <option value="">All</option>
            <option value="NEEDS_NEGOTIATION">Needs negotiation</option>
            <option value="QUOTE_AVAILABLE">Quote available</option>
            <option value="FEE_SET_BY_STAFF">Fee set by staff</option>
            <option value="NOT_REQUIRED">Not required</option>
          </select>
        </label>
        <label className="block">
          <span className="type-caption text-text-muted">Fulfillment</span>
          <select
            className="mt-1 w-full border border-border bg-surface px-3 py-2"
            value={fulfillment}
            onChange={(e) => setFulfillment(e.target.value)}
          >
            <option value="">All</option>
            <option value="PICKUP">Pickup</option>
            <option value="DELIVERY">Delivery</option>
          </select>
        </label>
        <div className="flex items-end">
          <Button type="submit" className="w-full">
            Filter
          </Button>
        </div>
      </form>

      {loading ? (
        <LoadingSpinner label="Loading orders…" />
      ) : error ? (
        <ErrorState title="Orders unavailable" description={error} />
      ) : orders.length === 0 ? (
        <EmptyState title="No orders" description="No orders match these filters." />
      ) : (
        <div className="overflow-x-auto border border-border">
          <table className="w-full min-w-[720px] border-collapse text-left">
            <thead className="bg-surface-muted">
              <tr>
                <th className="px-3 py-2 type-caption">Order</th>
                <th className="px-3 py-2 type-caption">Customer</th>
                <th className="px-3 py-2 type-caption">Date</th>
                <th className="px-3 py-2 type-caption">Status</th>
                <th className="px-3 py-2 type-caption">Payment</th>
                <th className="px-3 py-2 type-caption">Delivery</th>
                <th className="px-3 py-2 type-caption">Total</th>
                <th className="px-3 py-2 type-caption">Action</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => {
                const needsQuote =
                  o.fulfillmentMethod === "DELIVERY" &&
                  o.status !== "PAID" &&
                  (o.deliveryFeeStatus === "NEEDS_NEGOTIATION" ||
                    o.deliveryFeeStatus === "EXPIRED" ||
                    o.deliveryFeeStatus === "UNCONFIRMED");
                return (
                <tr key={o.id} className="border-t border-border">
                  <td className="px-3 py-2 type-body-sm">
                    <Link href={`/admin/orders/${o.id}`} className="text-primary">
                      {o.orderNumber}
                    </Link>
                  </td>
                  <td className="px-3 py-2 type-body-sm">{o.customer.email}</td>
                  <td className="px-3 py-2 type-body-sm">
                    {new Date(o.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-3 py-2 type-body-sm">{o.status}</td>
                  <td className="px-3 py-2 type-body-sm">
                    {o.payment ? `${o.payment.method} · ${o.payment.status}` : "—"}
                  </td>
                  <td className="px-3 py-2 type-body-sm">
                    {o.fulfillmentMethod === "DELIVERY"
                      ? o.deliveryFeeStatus
                      : "Pickup"}
                  </td>
                  <td className="px-3 py-2 type-body-sm">
                    {formatMoney(o.total, o.currency)}
                  </td>
                  <td className="px-3 py-2 type-body-sm">
                    {needsQuote ? (
                      <Link
                        href={`/admin/orders/${o.id}`}
                        className="text-accent underline-offset-2 hover:underline"
                      >
                        Set delivery quote
                      </Link>
                    ) : (
                      <Link
                        href={`/admin/orders/${o.id}`}
                        className="text-text-muted hover:text-primary"
                      >
                        Open
                      </Link>
                    )}
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {meta.totalPages > 1 ? (
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={meta.page <= 1}
            onClick={() => void load(meta.page - 1)}
          >
            Previous
          </Button>
          <span className="type-caption self-center text-text-muted">
            Page {meta.page} / {meta.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={meta.page >= meta.totalPages}
            onClick={() => void load(meta.page + 1)}
          >
            Next
          </Button>
        </div>
      ) : null}
    </div>
  );
}
