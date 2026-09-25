import { isStaffRole } from "./admin-api";

/**
 * Resolve where to send the user after login/register.
 * Navigation only — backend RBAC remains authoritative.
 *
 * Contract also covered by api/src/auth/post-login-destination.spec.ts
 * (keep behavior aligned).
 *
 * CUSTOMER default: /welcome (brief welcome, then home)
 * Staff default: /admin
 * /account remains a separate destination (header / explicit ?next=)
 */
export function resolvePostLoginPath(
  role: string | undefined | null,
  nextParam?: string | null,
): string {
  const next =
    typeof nextParam === "string" &&
    nextParam.startsWith("/") &&
    !nextParam.startsWith("//")
      ? nextParam
      : null;

  if (isStaffRole(role)) {
    if (next?.startsWith("/admin")) return next;
    // Honor explicit non-default destinations (e.g. /checkout)
    if (next && next !== "/account" && next !== "/welcome") return next;
    return "/admin";
  }

  // CUSTOMER (and unknown): never send to /admin via redirect helper
  if (next?.startsWith("/admin")) return "/welcome";
  return next ?? "/welcome";
}
