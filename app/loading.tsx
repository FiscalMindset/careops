import { Loader2 } from "lucide-react";

export default function LoadingPage() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="flex items-center gap-3">
        <Loader2 className="h-5 w-5 animate-spin text-info" />
        <p className="text-sm text-muted">Loading...</p>
      </div>
    </div>
  );
}
