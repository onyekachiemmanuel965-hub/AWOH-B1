"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  addToCart as addLine,
  cartCount,
  clearCart as clearLines,
  readCart,
  removeFromCart as removeLine,
  setCartQuantity as setQty,
  type CartLine,
} from "@/lib/cart";
import { useToast } from "@/components/feedback/toast";

type CartContextValue = {
  items: CartLine[];
  count: number;
  addItem: (productId: string, quantity?: number) => void;
  setQuantity: (productId: string, quantity: number) => void;
  removeItem: (productId: string) => void;
  clear: () => void;
  refresh: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartLine[]>([]);
  const { push } = useToast();

  const refresh = useCallback(() => {
    setItems(readCart());
  }, []);

  useEffect(() => {
    refresh();
    const onStorage = (e: StorageEvent) => {
      if (e.key === "awoh-b-cart-v1") refresh();
    };
    const onCustom = () => refresh();
    window.addEventListener("storage", onStorage);
    window.addEventListener("awoh-cart-updated", onCustom);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("awoh-cart-updated", onCustom);
    };
  }, [refresh]);

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      count: cartCount(items),
      addItem: (productId, quantity = 1) => {
        addLine(productId, quantity);
        refresh();
        push({
          title: "Added to cart",
          description: "You can review quantities anytime in your cart.",
          tone: "success",
        });
      },
      setQuantity: (productId, quantity) => {
        setQty(productId, quantity);
        refresh();
      },
      removeItem: (productId) => {
        removeLine(productId);
        refresh();
        push({ title: "Removed from cart", tone: "info" });
      },
      clear: () => {
        clearLines();
        refresh();
        push({ title: "Cart cleared", tone: "info" });
      },
      refresh,
    }),
    [items, push, refresh],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
