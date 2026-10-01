"use client";

import { useEffect, useState } from "react";
import {
  EmptyState,
  ErrorState,
  LoadingSpinner,
} from "@/components/feedback/feedback";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/auth/auth-provider";
import { fetchAudit } from "@/lib/admin-api";

export default function AdminAuditPage() {
  const { user } = useAuth();
  const [rows, setRows] = useState<
    Array<{
      id: string;
      action: string;
      entityType: string;
      entityId: string;
      actorUserId: string | null;
      createdAt: string;
      metadata: Record<string, unknown> | null;
    }>
  >([]);
  const [meta, setMeta] = useState({ page: 1, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load(page = 1) {
    setLoading(true);
    try {
      const res = await fetchAudit({ page, limit: 30 });
      setRows(res.data);
      setMeta(res.meta);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!user) return;
    void load(1);
  }, [user]);

  return (
    <div className="space-y-6">
      <h1 className="type-h2 text-primary">Audit log</h1>
      <p className="type-body-sm text-text-muted">
        ADMIN-only operational events. Secrets are never displayed.
      </p>
      {loading ? (
        <LoadingSpinner label="Loading audit…" />
      ) : error ? (
        <ErrorState title="Audit unavailable" description={error} />
      ) : rows.length === 0 ? (
        <EmptyState title="No events" description="Audit entries will appear here." />
      ) : (
        <ul className="list-none space-y-2 p-0">
          {rows.map((r) => (
            <li key={r.id} className="border border-border bg-surface px-3 py-2">
              <p className="type-label text-primary">{r.action}</p>
              <p className="type-caption text-text-muted">
                {r.entityType} · {r.entityId} · actor {r.actorUserId ?? "system"} ·{" "}
                {new Date(r.createdAt).toLocaleString()}
              </p>
              {r.metadata ? (
                <pre className="mt-1 overflow-x-auto type-caption text-text">
                  {JSON.stringify(r.metadata)}
                </pre>
              ) : null}
            </li>
          ))}
        </ul>
      )}
      {meta.totalPages > 1 ? (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            disabled={meta.page <= 1}
            onClick={() => void load(meta.page - 1)}
          >
            Previous
          </Button>
          <Button
            size="sm"
            variant="outline"
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
