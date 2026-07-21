import { LoadingIndicator } from "@/components/ui/loading-indicator";

export default function Loading() {
  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-white">
      <LoadingIndicator />
    </div>
  );
}
