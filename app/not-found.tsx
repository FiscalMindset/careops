import { FileSearch, Home } from "lucide-react";

export default function NotFoundPage() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="max-w-md text-center">
        <FileSearch className="mx-auto h-12 w-12 text-muted" />
        <h2 className="mt-4 text-xl font-semibold text-ink">Page not found</h2>
        <p className="mt-2 text-sm text-muted">The page you are looking for does not exist.</p>
        <a href="/"
          className="mt-6 inline-flex items-center gap-2 rounded-md bg-ink px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          <Home className="h-4 w-4" />
          Go home
        </a>
      </div>
    </div>
  );
}
