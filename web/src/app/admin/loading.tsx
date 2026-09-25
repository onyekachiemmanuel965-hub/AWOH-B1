import { LoadingSpinner } from "@/components/feedback/feedback";

export default function AdminLoading() {
  return (
    <div className="flex min-h-[30vh] items-center justify-center py-12">
      <LoadingSpinner label="Loading operations…" />
    </div>
  );
}
