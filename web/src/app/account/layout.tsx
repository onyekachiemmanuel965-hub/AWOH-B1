import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata({
  title: "Account",
  description: "Manage your AWOH-B account and orders.",
  path: "/account",
  noIndex: true,
});

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
