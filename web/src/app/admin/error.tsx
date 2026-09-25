"use client";

import { useEffect } from "react";
import { ErrorState } from "@/components/feedback/feedback";
import { Button } from "@/components/ui/button";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[AWOH-B admin]", error.digest ?? error.message);
  }, [error]);

  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 py-12">
      <ErrorState
        title="Operations error"
        description="Something went wrong loading this page. Try again or return to the dashboard."
      />
      <Button type="button" onClick={reset}>
        Try again
      </Button>
    </div>
  );
}
