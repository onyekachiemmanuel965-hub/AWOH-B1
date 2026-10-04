import { SiteHeader } from "@/components/navigation/site-header";
import { SiteFooter } from "@/components/navigation/site-footer";
import {
  PageAtmosphere,
  type PageAtmosphereKey,
} from "@/components/layout/page-atmosphere";
import { cn } from "@/lib/cn";

type StorefrontShellProps = {
  children: React.ReactNode;
  /** Material atmosphere keyed to page purpose */
  atmosphere?: PageAtmosphereKey;
  /** When false, caller already wraps content in <main> */
  wrapMain?: boolean;
  className?: string;
  mainClassName?: string;
};

/**
 * Shared storefront chrome: atmospheric page background + header/footer.
 * Admin routes should not use this shell.
 */
export function StorefrontShell({
  children,
  atmosphere = "marble",
  wrapMain = true,
  className,
  mainClassName,
}: StorefrontShellProps) {
  return (
    <div className={cn("storefront-shell relative isolate min-h-dvh", className)}>
      <PageAtmosphere variant={atmosphere} />
      <SiteHeader />
      {wrapMain ? (
        <main id="main-content" className={cn("relative", mainClassName)}>
          {children}
        </main>
      ) : (
        children
      )}
      <SiteFooter />
    </div>
  );
}
