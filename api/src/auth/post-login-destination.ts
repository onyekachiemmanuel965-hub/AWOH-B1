/**
 * Mirrors web/src/lib/post-login-path.ts — keep behavior aligned.
 * Pure navigation helper; not an authorization boundary.
 */
const STAFF = new Set([
  'ADMIN',
  'SALES_STAFF',
  'INVENTORY_MANAGER',
  'CONTENT_MANAGER',
]);

export function resolvePostLoginPath(
  role: string | undefined | null,
  nextParam?: string | null,
): string {
  const next =
    typeof nextParam === 'string' &&
    nextParam.startsWith('/') &&
    !nextParam.startsWith('//')
      ? nextParam
      : null;

  if (role && STAFF.has(role)) {
    if (next?.startsWith('/admin')) return next;
    if (next && next !== '/account' && next !== '/welcome') return next;
    return '/admin';
  }

  if (next?.startsWith('/admin')) return '/welcome';
  return next ?? '/welcome';
}
