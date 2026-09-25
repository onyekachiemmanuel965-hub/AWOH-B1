import type { Metadata } from "next";
import { createPageMetadata } from "@/lib/metadata";

export const metadata: Metadata = createPageMetadata({
  title: "Design System",
  description:
    "AWOH-B THE GREAT TILES VENTURE Stage 02 design system showcase.",
  path: "/design-system",
});

export default function DesignSystemLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
