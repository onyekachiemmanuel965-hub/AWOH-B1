/**
 * Local cart persistence for unauthenticated MVP (Stage 04).
 * Stores ONLY productId + quantity. Prices resolved from backend when rendering.
 */

export type CartLine = {
  productId: string;
  quantity: number;
};

const STORAGE_KEY = "awoh-b-cart-v1";

function canUseStorage() {
  return typeof window !== "undefined" && !!window.localStorage;
}

export function readCart(): CartLine[] {
  if (!canUseStorage()) return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((item) => {
        if (!item || typeof item !== "object") return null;
        const row = item as Record<string, unknown>;
        const productId = String(row.productId ?? "");
        const quantity = Number(row.quantity);
        if (!productId || !Number.isFinite(quantity)) return null;
        return {
          productId,
          quantity: Math.max(1, Math.min(99, Math.floor(quantity))),
        };
      })
      .filter((x): x is CartLine => Boolean(x));
  } catch {
    return [];
  }
}

export function writeCart(items: CartLine[]) {
  if (!canUseStorage()) return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  window.dispatchEvent(new Event("awoh-cart-updated"));
}

export function cartCount(items: CartLine[] = readCart()) {
  return items.reduce((sum, line) => sum + line.quantity, 0);
}

export function addToCart(productId: string, quantity = 1) {
  const qty = Math.max(1, Math.min(99, Math.floor(quantity)));
  const items = readCart();
  const existing = items.find((i) => i.productId === productId);
  if (existing) {
    existing.quantity = Math.min(99, existing.quantity + qty);
  } else {
    items.push({ productId, quantity: qty });
  }
  writeCart(items);
  return items;
}

export function setCartQuantity(productId: string, quantity: number) {
  const qty = Math.floor(quantity);
  let items = readCart();
  if (qty < 1) {
    items = items.filter((i) => i.productId !== productId);
  } else {
    const existing = items.find((i) => i.productId === productId);
    if (existing) existing.quantity = Math.min(99, qty);
    else items.push({ productId, quantity: Math.min(99, qty) });
  }
  writeCart(items);
  return items;
}

export function removeFromCart(productId: string) {
  const items = readCart().filter((i) => i.productId !== productId);
  writeCart(items);
  return items;
}

export function clearCart() {
  writeCart([]);
}
