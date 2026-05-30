"use client";

import { AlertCircle, RefreshCw } from "lucide-react";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="max-w-md text-center">
        <AlertCircle className="mx-auto h-12 w-12 text-danger" />
        <h2 className="mt-4 text-xl font-semibold text-ink">Something went wrong</h2>
        <p className="mt-2 text-sm text-muted">{error.message || "An unexpected error occurred."}</p>
        <button onClick={reset}
          className="mt-6 inline-flex items-center gap-2 rounded-md bg-ink px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          <RefreshCw className="h-4 w-4" />
          Try again
        </button>
      </div>
    </div>
  );
}
