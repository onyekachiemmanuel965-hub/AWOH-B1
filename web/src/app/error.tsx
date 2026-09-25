"use client";

import { useEffect } from "react";
import Link from "next/link";
import { ErrorState } from "@/components/feedback/feedback";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Client-side log only — never render secrets/stack to the UI.
    console.error("[AWOH-B]", error.digest ?? error.message);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-[50vh] max-w-lg flex-col items-center justify-center gap-6 px-4 py-16">
      <ErrorState
        title="Something went wrong"
        description="Please try again. If the problem continues, return home and continue browsing."
      />
      <div className="flex flex-wrap gap-3">
        <Button type="button" onClick={reset}>
          Try again
        </Button>
        <Link
          href="/"
          className="inline-flex h-11 items-center justify-center rounded-md border border-border bg-surface px-4 type-button text-primary no-underline"
        >
          Go home
        </Link>
      </div>
    </div>
  );
}
