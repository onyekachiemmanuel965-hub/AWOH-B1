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

  type DeliveryInternalSummary = {
    suggestedFee?: string | null;
    appliedFee?: number | null;
    totalWeightKg?: number | null;
    distanceKm?: number | null;
    distanceAvailable?: boolean;
    reason?: string;
    requiresStaffQuote?: boolean;
    status?: string;
  };

  function asInternalSummary(value: unknown): DeliveryInternalSummary | null {
    if (!value || typeof value !== "object") return null;
    return value as DeliveryInternalSummary;
  }

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
          const summary = asInternalSummary(d.internal);
          const suggested =
            summary?.suggestedFee ??
            (summary?.appliedFee != null ? String(summary.appliedFee) : "");
          if (suggested) {
            setFee((prev) => prev || suggested);
          }
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

  const isDelivery = order.fulfillmentMethod === "DELIVERY";
  const showDeliveryOps =
    canManage &&
    isDelivery &&
    order.status !== "PAID" &&
    order.status !== "CANCELLED" &&
    (order.deliveryFeeStatus === "NEEDS_NEGOTIATION" ||
      order.deliveryFeeStatus === "QUOTE_AVAILABLE" ||
      order.deliveryFeeStatus === "FEE_SET_BY_STAFF" ||
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

      <section className="border border-border bg-surface p-4 space-y-4">
        <div>
          <h2 className="type-h3 text-primary">Delivery quote</h2>
          {!isDelivery ? (
            <p className="mt-2 type-body-sm text-text-muted">
              This order is <strong>Pickup</strong> — no delivery quote is
              required. Create a checkout order with fulfillment set to{" "}
              <strong>Delivery</strong> to enter a delivery fee here.
            </p>
          ) : order.status === "PAID" ? (
            <p className="mt-2 type-body-sm text-text-muted">
              This delivery order is already paid. Delivery fee:{" "}
              {order.deliveryFee != null
                ? formatMoney(order.deliveryFee, order.currency)
                : "—"}
            </p>
          ) : !canManage ? (
            <p className="mt-2 type-body-sm text-text-muted">
              Only Admin or Sales Staff can set the delivery quote.
            </p>
          ) : showDeliveryOps ? (
            <p className="mt-2 type-body-sm text-text-muted">
              Set the agreed delivery fee after discussing with the customer.
              The backend recalculates the order total. The customer must review
              and confirm the quote before Pay Now unlocks. Changing the fee
              invalidates any previous customer confirmation.
            </p>
          ) : (
            <p className="mt-2 type-body-sm text-text-muted">
              Delivery quote is not editable for status{" "}
              {order.deliveryFeeStatus}.
            </p>
          )}
        </div>

        {isDelivery &&
        (order.shippingLine1 ||
          order.shippingCity ||
          order.shippingLga ||
          order.shippingState) ? (
          <div className="space-y-1 type-body-sm">
            <p className="type-caption text-text-muted">Shipping address</p>
            <p>
              <span className="text-text-muted">State: </span>
              {order.shippingState || "—"}
            </p>
            <p>
              <span className="text-text-muted">LGA: </span>
              {order.shippingLga || "—"}
            </p>
            <p>
              <span className="text-text-muted">Town/City: </span>
              {order.shippingCity || "—"}
            </p>
            <p>
              <span className="text-text-muted">Address: </span>
              {order.shippingLine1 || "—"}
            </p>
            {order.shippingNotes ? (
              <p className="text-text-muted">
                Instructions: {order.shippingNotes}
              </p>
            ) : null}
          </div>
        ) : null}

        {showDeliveryOps ? (
          <>
            {(() => {
              const summary = asInternalSummary(internal);
              if (!summary) {
                return (
                  <p className="type-body-sm text-text-muted">
                    No internal delivery estimate available. Enter a fee from
                    sales discussion.
                  </p>
                );
              }
              const suggested =
                summary.suggestedFee ??
                (summary.appliedFee != null
                  ? String(summary.appliedFee)
                  : null);
              return (
                <dl className="grid gap-2 sm:grid-cols-2 type-body-sm border border-border bg-surface-muted p-3">
                  <div>
                    <dt className="type-caption text-text-muted">
                      Suggested fee (internal)
                    </dt>
                    <dd>
                      {suggested
                        ? formatMoney(suggested, order.currency)
                        : "—"}
                    </dd>
                  </div>
                  <div>
                    <dt className="type-caption text-text-muted">
                      Est. weight (kg)
                    </dt>
                    <dd>
                      {summary.totalWeightKg != null
                        ? String(summary.totalWeightKg)
                        : "—"}
                    </dd>
                  </div>
                  <div>
                    <dt className="type-caption text-text-muted">
                      Est. distance (km)
                    </dt>
                    <dd>
                      {summary.distanceKm != null
                        ? String(summary.distanceKm)
                        : summary.distanceAvailable === false
                          ? "Unavailable"
                          : "—"}
                    </dd>
                  </div>
                  <div>
                    <dt className="type-caption text-text-muted">
                      Calculator note
                    </dt>
                    <dd>{summary.reason ?? summary.status ?? "—"}</dd>
                  </div>
                </dl>
              );
            })()}
            <form
              className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]"
              onSubmit={onOverride}
            >
              <Input
                id="fee"
                label="Delivery quote for customer (NGN)"
                value={fee}
                onChange={(e) => setFee(e.target.value)}
                required
              />
              <Input
                id="reason"
                label="Reason (optional)"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
              <div className="flex items-end">
                <Button type="submit" loading={busy}>
                  Set delivery fee
                </Button>
              </div>
            </form>
          </>
        ) : null}
      </section>
    </div>
  );
}
