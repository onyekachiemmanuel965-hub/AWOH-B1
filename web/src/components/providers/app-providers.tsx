"use client";

import { ToastProvider } from "@/components/feedback/toast";
import { CartProvider } from "@/components/cart/cart-provider";
import { AuthProvider } from "@/components/auth/auth-provider";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <AuthProvider>
        <CartProvider>{children}</CartProvider>
      </AuthProvider>
    </ToastProvider>
  );
}
