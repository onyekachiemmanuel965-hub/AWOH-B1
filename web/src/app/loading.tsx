import { LoadingSpinner } from "@/components/feedback/feedback";

export default function Loading() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center px-4 py-16">
      <LoadingSpinner label="Loading…" />
    </div>
  );
}
