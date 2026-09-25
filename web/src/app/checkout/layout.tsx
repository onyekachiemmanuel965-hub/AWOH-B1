import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata({
  title: "Checkout",
  description: "Complete your AWOH-B order with delivery and payment.",
  path: "/checkout",
  noIndex: true,
});

export default function CheckoutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
