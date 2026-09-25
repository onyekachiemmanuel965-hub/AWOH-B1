import { createPageMetadata } from "@/lib/metadata";
import { WelcomeClient } from "./welcome-client";

export const metadata = createPageMetadata({
  title: "Welcome",
  description: "You are signed in to AWOH-B THE GREAT TILES VENTURE.",
  path: "/welcome",
  noIndex: true,
});

export default function WelcomePage() {
  return <WelcomeClient />;
}
