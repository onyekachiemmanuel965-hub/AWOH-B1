import { Suspense } from "react";
import { createPageMetadata } from "@/lib/metadata";
import { LoadingSpinner } from "@/components/feedback/feedback";
import LoginPage from "./login-client";

export const metadata = createPageMetadata({
  title: "Sign in",
  description: "Sign in to your AWOH-B customer account.",
  path: "/login",
  noIndex: true,
});

export default function LoginRoute() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] items-center justify-center py-16">
          <LoadingSpinner label="Loading sign-in…" />
        </div>
      }
    >
      <LoginPage />
    </Suspense>
  );
}
