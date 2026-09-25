"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ASSIGNABLE_ROLES,
  fetchStaff,
  updateStaffRole,
  updateStaffStatus,
  type AssignableRole,
  type StaffUser,
} from "@/lib/admin-api";
import {
  EmptyState,
  ErrorState,
  LoadingSpinner,
} from "@/components/feedback/feedback";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Modal } from "@/components/feedback/modal";
import { useToast } from "@/components/feedback/toast";
import { useAuth } from "@/components/auth/auth-provider";

function roleLabel(code: string, fallback?: string) {
  return (
    fallback ||
    ASSIGNABLE_ROLES.find((r) => r.value === code)?.label ||
    code
  );
}

export default function AdminStaffPage() {
  const { user } = useAuth();
  const { push } = useToast();
  const [rows, setRows] = useState<StaffUser[]>([]);
  const [meta, setMeta] = useState({ page: 1, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [roleTarget, setRoleTarget] = useState<StaffUser | null>(null);
  const [roleValue, setRoleValue] = useState<AssignableRole>("CUSTOMER");
  const [statusTarget, setStatusTarget] = useState<StaffUser | null>(null);
  const [viewTarget, setViewTarget] = useState<StaffUser | null>(null);

  const load = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const res = await fetchStaff({ page, limit: 30 });
      setRows(res.data);
      setMeta({ page: res.meta.page, totalPages: res.meta.totalPages });
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load staff.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(1);
  }, [load]);

  async function confirmRoleChange() {
    if (!roleTarget) return;
    setBusy(true);
    try {
      await updateStaffRole(roleTarget.id, roleValue);
      push({
        title: "Role updated",
        description: `${roleTarget.name} is now ${roleLabel(roleValue)}.`,
        tone: "success",
      });
      setRoleTarget(null);
      await load(meta.page);
    } catch (err) {
      push({
        title: "Role change failed",
        description: err instanceof Error ? err.message : "Request failed.",
        tone: "error",
      });
    } finally {
      setBusy(false);
    }
  }

  async function confirmStatusChange() {
    if (!statusTarget) return;
    const nextActive = !statusTarget.isActive;
    setBusy(true);
    try {
      await updateStaffStatus(statusTarget.id, nextActive);
      push({
        title: nextActive ? "Account activated" : "Account deactivated",
        description: statusTarget.email,
        tone: "success",
      });
      setStatusTarget(null);
      await load(meta.page);
    } catch (err) {
      push({
        title: "Status change failed",
        description: err instanceof Error ? err.message : "Request failed.",
        tone: "error",
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="type-h2 text-primary">Staff</h1>
        <p className="mt-1 type-body-sm text-text-muted">
          Manage staff roles and account access. Employees register as Customer,
          then an administrator assigns their role.
        </p>
      </div>

      {loading ? (
        <LoadingSpinner label="Loading users…" />
      ) : error ? (
        <ErrorState title="Staff unavailable" description={error} />
      ) : rows.length === 0 ? (
        <EmptyState
          title="No users"
          description="Registered users will appear here."
        />
      ) : (
        <div className="overflow-x-auto border border-border">
          <table className="w-full min-w-[880px] border-collapse text-left">
            <thead className="bg-surface-muted">
              <tr>
                <th className="px-3 py-2 type-caption text-text-muted">
                  Employee
                </th>
                <th className="px-3 py-2 type-caption text-text-muted">Email</th>
                <th className="px-3 py-2 type-caption text-text-muted">Role</th>
                <th className="px-3 py-2 type-caption text-text-muted">Status</th>
                <th className="px-3 py-2 type-caption text-text-muted">Access</th>
                <th className="px-3 py-2 type-caption text-text-muted">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const isSelf = user?.id === row.id;
                const accessText =
                  row.accessLabels?.join(", ") ||
                  (row.role === "CUSTOMER" ? "Storefront only" : "—");
                return (
                  <tr key={row.id} className="border-t border-border">
                    <td className="px-3 py-3 type-body-sm text-primary">
                      {row.name}
                      {isSelf ? (
                        <span className="ml-2 type-caption text-text-muted">
                          (you)
                        </span>
                      ) : null}
                    </td>
                    <td className="px-3 py-3 type-body-sm text-text">
                      {row.email}
                    </td>
                    <td className="px-3 py-3 type-body-sm text-text">
                      {roleLabel(row.role, row.roleLabel)}
                    </td>
                    <td className="px-3 py-3 type-body-sm text-text">
                      {row.isActive ? "Active" : "Inactive"}
                    </td>
                    <td className="px-3 py-3 type-body-sm text-text-muted max-w-[220px]">
                      {accessText}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setViewTarget(row)}
                        >
                          View
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={isSelf || busy}
                          onClick={() => {
                            setRoleTarget(row);
                            setRoleValue(row.role as AssignableRole);
                          }}
                        >
                          Change role
                        </Button>
                        <Button
                          size="sm"
                          variant={row.isActive ? "destructive" : "outline"}
                          disabled={isSelf || busy}
                          onClick={() => setStatusTarget(row)}
                        >
                          {row.isActive ? "Deactivate" : "Activate"}
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {!loading && meta.totalPages > 1 ? (
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={meta.page <= 1}
            onClick={() => void load(meta.page - 1)}
          >
            Previous
          </Button>
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

      <Modal
        open={!!viewTarget}
        onClose={() => setViewTarget(null)}
        title="Employee access"
        description={
          viewTarget
            ? `${viewTarget.name} · ${viewTarget.email}`
            : undefined
        }
        cancelLabel="Close"
      >
        {viewTarget ? (
          <div className="space-y-3">
            <div>
              <p className="type-caption text-text-muted">Role</p>
              <p className="type-body text-primary">
                {roleLabel(viewTarget.role, viewTarget.roleLabel)}
              </p>
            </div>
            <div>
              <p className="type-caption text-text-muted">Status</p>
              <p className="type-body text-primary">
                {viewTarget.isActive ? "Active" : "Inactive"}
              </p>
            </div>
            <div>
              <p className="type-caption text-text-muted">Access</p>
              {viewTarget.accessLabels && viewTarget.accessLabels.length > 0 ? (
                <ul className="mt-1 list-none space-y-1 p-0">
                  {viewTarget.accessLabels.map((label) => (
                    <li key={label} className="type-body-sm text-primary">
                      {label}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="type-body-sm text-text-muted">
                  Storefront customer access only — no admin modules.
                </p>
              )}
            </div>
          </div>
        ) : null}
      </Modal>

      <Modal
        open={!!roleTarget}
        onClose={() => setRoleTarget(null)}
        title="Change role"
        description={
          roleTarget
            ? `You are changing this user's role to ${roleLabel(roleValue)}.`
            : undefined
        }
        confirmLabel={busy ? "Saving…" : "Confirm role change"}
        onConfirm={() => void confirmRoleChange()}
      >
        <Select
          id="staff-role"
          label="New role"
          value={roleValue}
          onChange={(e) => setRoleValue(e.target.value as AssignableRole)}
          options={ASSIGNABLE_ROLES.map((r) => ({
            value: r.value,
            label: r.label,
          }))}
        />
        {roleValue === "ADMIN" ? (
          <p className="mt-2 type-caption text-text-muted">
            Admin grants full operational access, including staff management.
          </p>
        ) : null}
      </Modal>

      <Modal
        open={!!statusTarget}
        onClose={() => setStatusTarget(null)}
        title={
          statusTarget?.isActive ? "Deactivate account" : "Activate account"
        }
        description={
          statusTarget?.isActive
            ? "Deactivate this account? The user will no longer be able to sign in or use staff features until reactivated."
            : statusTarget
              ? `Restore access for ${statusTarget.name}?`
              : undefined
        }
        confirmLabel={
          busy
            ? "Saving…"
            : statusTarget?.isActive
              ? "Deactivate"
              : "Activate"
        }
        destructive={!!statusTarget?.isActive}
        onConfirm={() => void confirmStatusChange()}
      />
    </div>
  );
}
