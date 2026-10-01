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

export default function AdminPaymentsPage() {
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
          status: "AWAITING_OFFLINE_PAYMENT",
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
              : "Failed to load payment operations.",
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="type-h2 text-primary">Payments</h1>
        <p className="mt-1 type-body-sm text-text-muted">
          Offline / cash payment operations. Confirm only after the
          authoritative order total is correct (including any delivery fee the
          customer has confirmed).
        </p>
      </div>

      {loading ? (
        <LoadingSpinner label="Loading payments…" />
      ) : error ? (
        <ErrorState title="Payments unavailable" description={error} />
      ) : orders.length === 0 ? (
        <EmptyState
          title="No offline payments waiting"
          description="Orders awaiting cash confirmation will appear here."
          action={
            <Link href="/admin/orders" className="type-label text-primary">
              Browse all orders
            </Link>
          }
        />
      ) : (
        <div className="overflow-x-auto border border-border">
          <table className="w-full min-w-[720px] border-collapse text-left">
            <thead className="bg-surface-muted">
              <tr>
                <th className="px-3 py-2 type-caption">Order</th>
                <th className="px-3 py-2 type-caption">Customer</th>
                <th className="px-3 py-2 type-caption">Payment</th>
                <th className="px-3 py-2 type-caption">Total</th>
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
                  <td className="px-3 py-2 type-body-sm">{o.customer.email}</td>
                  <td className="px-3 py-2 type-body-sm">
                    {o.payment
                      ? `${o.payment.method} · ${o.payment.status}`
                      : "—"}
                  </td>
                  <td className="px-3 py-2 type-body-sm">
                    {formatMoney(o.total, o.currency)}
                  </td>
                  <td className="px-3 py-2 type-body-sm">
                    <Link
                      href={`/admin/orders/${o.id}`}
                      className="text-accent underline-offset-2 hover:underline"
                    >
                      Confirm offline
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
