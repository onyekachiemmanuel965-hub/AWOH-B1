"use client";

import Link from "next/link";
import { useState } from "react";
import { PUBLIC_NAV_LINKS } from "@/lib/public-nav";
import { BrandMark } from "@/components/navigation/brand-mark";
import { useCart } from "@/components/cart/cart-provider";
import { useAuth } from "@/components/auth/auth-provider";
import { cn } from "@/lib/cn";

const navLinks = PUBLIC_NAV_LINKS;

const primaryCtaClass =
  "inline-flex h-9 items-center justify-center rounded-md border border-primary bg-primary px-4 type-button text-text-inverse no-underline shadow-xs transition-colors hover:bg-primary-hover";

const quietLinkClass =
  "inline-flex h-9 items-center justify-center rounded-md border border-border bg-surface px-3 type-label text-primary no-underline hover:border-border-strong";

export function SiteHeader({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const { count } = useCart();
  const { user, loading, logout } = useAuth();

  async function goToSignIn() {
    setOpen(false);
    if (user) await logout();
    window.location.assign("/login");
  }

  return (
    <header
      className={cn(
        "sticky top-0 z-[var(--z-header)] border-b border-border/80 bg-background/90 backdrop-blur-md",
        className,
      )}
    >
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-[100] focus:rounded-md focus:bg-primary focus:px-3 focus:py-2 focus:type-label focus:text-text-inverse"
      >
        Skip to main content
      </a>
      <div className="mx-auto flex h-[var(--header-height)] max-w-[var(--container-wide)] items-center gap-3 px-4 sm:gap-4 sm:px-6 lg:px-8">
        <BrandMark />

        <nav
          className="ml-4 hidden items-center gap-6 lg:ml-8 lg:flex"
          aria-label="Primary"
        >
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="type-label text-text-muted no-underline transition-colors hover:text-primary"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          <Link
            href="/products"
            className={cn(primaryCtaClass, "hidden sm:inline-flex")}
          >
            Explore Collections
          </Link>
          {!loading && user ? (
            <Link href="/account" className={cn(quietLinkClass, "hidden sm:inline-flex")}>
              My Account
            </Link>
          ) : null}
          {!loading ? (
            <button
              type="button"
              className={cn(quietLinkClass, "hidden sm:inline-flex")}
              onClick={goToSignIn}
            >
              Sign in
            </button>
          ) : null}
          <Link
            href="/cart"
            className={quietLinkClass}
            aria-label={`Cart with ${count} items`}
          >
            Cart{count > 0 ? ` (${count})` : ""}
          </Link>
          <button
            type="button"
            className="inline-flex size-10 items-center justify-center rounded-md border border-border lg:hidden"
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((v) => !v)}
          >
            <span className="sr-only">Menu</span>
            <span aria-hidden className="flex w-4 flex-col gap-1">
              <span className="h-px w-full bg-primary" />
              <span className="h-px w-full bg-primary" />
              <span className="h-px w-full bg-primary" />
            </span>
          </button>
        </div>
      </div>

      <div
        id="mobile-nav"
        hidden={!open}
        className="border-t border-border bg-surface px-4 py-4 lg:hidden"
      >
        <nav className="flex flex-col gap-3" aria-label="Mobile">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="type-body text-primary no-underline"
              onClick={() => setOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          {user ? (
            <Link
              href="/account"
              className="type-body text-primary no-underline"
              onClick={() => setOpen(false)}
            >
              My Account
            </Link>
          ) : null}
          <button
            type="button"
            className="type-body text-left text-primary"
            onClick={goToSignIn}
          >
            Sign in
          </button>
          <Link
            href="/cart"
            className="type-body text-primary no-underline"
            onClick={() => setOpen(false)}
          >
            Cart{count > 0 ? ` (${count})` : ""}
          </Link>
          <Link
            href="/products"
            className={cn(primaryCtaClass, "mt-2 w-full")}
            onClick={() => setOpen(false)}
          >
            Explore Collections
          </Link>
        </nav>
      </div>
    </header>
  );
}
