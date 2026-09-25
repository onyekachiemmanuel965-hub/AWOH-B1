import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata({
  title: "Cart",
  description: "Review materials selected for your AWOH-B order.",
  path: "/cart",
  noIndex: true,
});

export default function CartLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
