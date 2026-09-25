import { createPageMetadata } from "@/lib/metadata";
import { AdminShell } from "./admin-shell";

export const metadata = createPageMetadata({
  title: "Operations",
  description: "AWOH-B staff operations dashboard.",
  path: "/admin",
  noIndex: true,
});

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminShell>{children}</AdminShell>;
}
