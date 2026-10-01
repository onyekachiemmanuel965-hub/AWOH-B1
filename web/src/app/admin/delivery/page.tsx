"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  EmptyState,
  ErrorState,
  LoadingSpinner,
} from "@/components/feedback/feedback";
import { useAuth } from "@/components/auth/auth-provider";
import { fetchAdminOrders, type StaffOrder } from "@/lib/admin-api";
import { formatMoney } from "@/lib/money";

export default function AdminDeliveryPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<StaffOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await fetchAdminOrders({
          page: 1,
          limit: 40,
          fulfillmentMethod: "DELIVERY",
        });
        if (!cancelled) {
          setOrders(res.data);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Failed to load delivery orders.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const needsQuote = orders.filter(
    (o) =>
      o.status !== "PAID" &&
      (o.deliveryFeeStatus === "NEEDS_NEGOTIATION" ||
        o.deliveryFeeStatus === "EXPIRED" ||
        o.deliveryFeeStatus === "UNCONFIRMED"),
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="type-h2 text-primary">Delivery</h1>
        <p className="mt-1 type-body-sm text-text-muted">
          Operational delivery quotes. Enter the agreed fee after discussing
          with the customer. Customers must confirm the quote before payment.
          Internal calculator details stay staff-only.
        </p>
      </div>

      {loading ? (
        <LoadingSpinner label="Loading delivery orders…" />
      ) : error ? (
        <ErrorState title="Delivery unavailable" description={error} />
      ) : orders.length === 0 ? (
        <EmptyState
          title="No delivery orders"
          description="Delivery checkouts will appear here for quote management."
        />
      ) : (
        <>
          {needsQuote.length > 0 ? (
            <p className="type-body-sm text-text">
              {needsQuote.length} order
              {needsQuote.length === 1 ? "" : "s"} awaiting a sales delivery
              quote.
            </p>
          ) : null}
          <div className="overflow-x-auto border border-border">
            <table className="w-full min-w-[760px] border-collapse text-left">
              <thead className="bg-surface-muted">
                <tr>
                  <th className="px-3 py-2 type-caption">Order</th>
                  <th className="px-3 py-2 type-caption">Customer</th>
                  <th className="px-3 py-2 type-caption">Destination</th>
                  <th className="px-3 py-2 type-caption">Quote status</th>
                  <th className="px-3 py-2 type-caption">Fee</th>
                  <th className="px-3 py-2 type-caption">Action</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id} className="border-t border-border">
                    <td className="px-3 py-2 type-body-sm">
                      <Link
                        href={`/admin/orders/${o.id}`}
                        className="text-primary"
                      >
                        {o.orderNumber}
                      </Link>
                    </td>
                    <td className="px-3 py-2 type-body-sm">
                      {o.customer.email}
                    </td>
                    <td className="px-3 py-2 type-body-sm">
                      {[o.shippingCity, o.shippingState]
                        .filter(Boolean)
                        .join(", ") || "—"}
                    </td>
                    <td className="px-3 py-2 type-body-sm">
                      {o.deliveryFeeStatus}
                    </td>
                    <td className="px-3 py-2 type-body-sm">
                      {o.deliveryFee != null
                        ? formatMoney(o.deliveryFee, o.currency)
                        : "—"}
                    </td>
                    <td className="px-3 py-2 type-body-sm">
                      <Link
                        href={`/admin/orders/${o.id}`}
                        className="inline-flex h-9 items-center border border-border bg-surface px-3 type-caption text-primary no-underline hover:border-primary"
                      >
                        {o.deliveryFeeStatus === "NEEDS_NEGOTIATION" ||
                        o.deliveryFeeStatus === "EXPIRED"
                          ? "Set quote"
                          : "Open"}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
