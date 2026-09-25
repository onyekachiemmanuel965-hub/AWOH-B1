import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata({
  title: "Create account",
  description: "Register for an AWOH-B customer account.",
  path: "/register",
  noIndex: true,
});

export default function RegisterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
