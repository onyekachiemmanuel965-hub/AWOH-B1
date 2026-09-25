"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { FormEvent, useCallback, useEffect, useState } from "react";
import {
  ErrorState,
  LoadingSpinner,
} from "@/components/feedback/feedback";
import { useToast } from "@/components/feedback/toast";
import { useAuth } from "@/components/auth/auth-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  confirmOfflinePayment,
  fetchAdminOrder,
  fetchDeliveryInternal,
  overrideDelivery,
  type StaffOrder,
} from "@/lib/admin-api";
import { formatMoney } from "@/lib/money";

export default function AdminOrderDetailPage() {
  const params = useParams<{ id: string }>();
  const { user } = useAuth();
  const { push } = useToast();
  const [order, setOrder] = useState<StaffOrder | null>(null);
  const [internal, setInternal] = useState<unknown>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [fee, setFee] = useState("");
  const [reason, setReason] = useState("");

  const canManage =
    user?.role === "ADMIN" || user?.role === "SALES_STAFF";

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAdminOrder(params.id);
      setOrder(data);
      if (canManage && data.fulfillmentMethod === "DELIVERY") {
        try {
          const d = await fetchDeliveryInternal(params.id);
          setInternal(d.internal);
        } catch {
          setInternal(null);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Order not found.");
    } finally {
      setLoading(false);
    }
  }, [params.id, canManage]);

  useEffect(() => {
    void load();
  }, [load]);

  async function onConfirmOffline() {
    if (!order) return;
    setBusy(true);
    try {
      const res = await confirmOfflinePayment(order.id, reason || undefined);
      setOrder(res.order as unknown as StaffOrder);
      push({
        title: res.alreadyProcessed ? "Already confirmed" : "Offline payment confirmed",
        tone: "success",
      });
      await load();
    } catch (err) {
      push({
        title: "Confirmation failed",
        description: err instanceof Error ? err.message : undefined,
        tone: "error",
      });
    } finally {
      setBusy(false);
    }
  }

  async function onOverride(e: FormEvent) {
    e.preventDefault();
    if (!order) return;
    setBusy(true);
    try {
      await overrideDelivery(order.id, fee, reason || undefined);
      push({ title: "Delivery fee updated", tone: "success" });
      setFee("");
      await load();
    } catch (err) {
      push({
        title: "Delivery update failed",
        description: err instanceof Error ? err.message : undefined,
        tone: "error",
      });
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <LoadingSpinner label="Loading order…" />;
  if (error || !order) {
    return <ErrorState title="Order unavailable" description={error ?? "Not found"} />;
  }

  const showOffline =
    canManage &&
    order.status === "AWAITING_OFFLINE_PAYMENT" &&
    order.payment?.method === "OFFLINE_CASH";

  const showDeliveryOps =
    canManage &&
    order.fulfillmentMethod === "DELIVERY" &&
    (order.deliveryFeeStatus === "NEEDS_NEGOTIATION" ||
      order.deliveryFeeStatus === "QUOTE_AVAILABLE" ||
      order.deliveryFeeStatus === "UNCONFIRMED" ||
      order.deliveryFeeStatus === "EXPIRED");

  return (
    <div className="space-y-8">
      <div>
        <Link href="/admin/orders" className="type-caption text-text-muted">
          ← Orders
        </Link>
        <h1 className="mt-2 type-h2 text-primary">{order.orderNumber}</h1>
        <p className="type-body-sm text-text-muted">
          {order.status} · {order.fulfillmentMethod}
        </p>
      </div>

      <dl className="grid gap-3 sm:grid-cols-2">
        <div>
          <dt className="type-caption text-text-muted">Customer</dt>
          <dd className="type-body">
            {order.customer.firstName} {order.customer.lastName}
            <br />
            {order.customer.email}
          </dd>
        </div>
        <div>
          <dt className="type-caption text-text-muted">Payment</dt>
          <dd className="type-body">
            {order.payment
              ? `${order.payment.method} · ${order.payment.status}`
              : "—"}
          </dd>
        </div>
        <div>
          <dt className="type-caption text-text-muted">Delivery status</dt>
          <dd className="type-body">{order.deliveryFeeStatus}</dd>
        </div>
        <div>
          <dt className="type-caption text-text-muted">Totals</dt>
          <dd className="type-body">
            Subtotal {formatMoney(order.subtotal, order.currency)}
            <br />
            Delivery{" "}
            {order.deliveryFee != null
              ? formatMoney(order.deliveryFee, order.currency)
              : "—"}
            <br />
            Total {formatMoney(order.total, order.currency)}
          </dd>
        </div>
      </dl>

      <section>
        <h2 className="type-h3 text-primary">Items</h2>
        <ul className="mt-2 list-none space-y-2 p-0">
          {order.items.map((item) => (
            <li key={item.id} className="flex justify-between type-body-sm">
              <span>
                {item.productName} × {item.quantity}
              </span>
              <span>{formatMoney(item.lineTotal, order.currency)}</span>
            </li>
          ))}
        </ul>
      </section>

      {showOffline ? (
        <section className="border border-border bg-surface p-4 space-y-3">
          <h2 className="type-h3 text-primary">Confirm offline / cash payment</h2>
          <p className="type-body-sm text-text-muted">
            Authoritative total: {formatMoney(order.total, order.currency)}
          </p>
          <Input
            id="offline-reason"
            label="Reason (optional)"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
          <Button onClick={() => void onConfirmOffline()} loading={busy}>
            Confirm cash received
          </Button>
        </section>
      ) : null}

      {showDeliveryOps ? (
        <section className="border border-border bg-surface p-4 space-y-4">
          <h2 className="type-h3 text-primary">Delivery negotiation</h2>
          {internal ? (
            <pre className="overflow-x-auto bg-surface-muted p-3 type-caption text-text">
              {JSON.stringify(internal, null, 2)}
            </pre>
          ) : (
            <p className="type-body-sm text-text-muted">
              No internal delivery snapshot available.
            </p>
          )}
          <form className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]" onSubmit={onOverride}>
            <Input
              id="fee"
              label="Negotiated fee (NGN)"
              value={fee}
              onChange={(e) => setFee(e.target.value)}
              required
            />
            <Input
              id="reason"
              label="Reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
            <div className="flex items-end">
              <Button type="submit" loading={busy}>
                Set delivery fee
              </Button>
            </div>
          </form>
        </section>
      ) : null}
    </div>
  );
}
