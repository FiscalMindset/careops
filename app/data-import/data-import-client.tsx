"use client";

import { useState, useRef, useCallback } from "react";
import { PageHeader, Badge } from "@/components/ui";
import { Upload, Download, CheckCircle2, XCircle, AlertTriangle, RefreshCw } from "lucide-react";

interface SourceEntry {
  key: string;
  label: string;
  specName: string;
  table: string;
  columns: string[];
  rowCount: number;
}

interface ImportResult {
  success: boolean;
  recordsImported: number;
  totalRecords: number;
  validationErrors: string[];
  dbSeeded: boolean;
  error?: string;
}

type ImportStatus = "idle" | "uploading" | "validating" | "success" | "error";

export default function DataImportClient({ entries }: { entries: SourceEntry[] }) {
  const [statuses, setStatuses] = useState<Record<string, ImportStatus>>({});
  const [results, setResults] = useState<Record<string, ImportResult | null>>({});
  const [counts, setCounts] = useState<Record<string, number>>(
    Object.fromEntries(entries.map((e) => [e.key, e.rowCount]))
  );
  const [refreshing, setRefreshing] = useState(false);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const refreshCounts = useCallback(async () => {
    setRefreshing(true);
    try {
      const res = await fetch("/api/data/counts");
      const data = await res.json();
      if (data.counts) {
        setCounts(data.counts);
      }
    } catch {
    } finally {
      setRefreshing(false);
    }
  }, []);

  const handleFileSelect = useCallback(async (sourceKey: string, file: File | null) => {
    if (!file) return;

    setStatuses((prev) => ({ ...prev, [sourceKey]: "uploading" }));
    setResults((prev) => ({ ...prev, [sourceKey]: null }));

    const formData = new FormData();
    formData.append("sourceKey", sourceKey);
    formData.append("file", file);

    try {
      setStatuses((prev) => ({ ...prev, [sourceKey]: "validating" }));
      const res = await fetch("/api/data/import", { method: "POST", body: formData });
      const result: ImportResult = await res.json();

      setResults((prev) => ({ ...prev, [sourceKey]: result }));
      setStatuses((prev) => ({ ...prev, [sourceKey]: result.success ? "success" : "error" }));

      if (result.success) {
        setCounts((prev) => ({ ...prev, [sourceKey]: result.totalRecords }));
        await refreshCounts();
      }
    } catch (err: any) {
      setResults((prev) => ({
        ...prev,
        [sourceKey]: { success: false, recordsImported: 0, totalRecords: 0, validationErrors: [], dbSeeded: false, error: err.message },
      }));
      setStatuses((prev) => ({ ...prev, [sourceKey]: "error" }));
    }

    if (fileInputRefs.current[sourceKey]) {
      fileInputRefs.current[sourceKey]!.value = "";
    }
  }, [refreshCounts]);

  const handleDownload = useCallback((sourceKey: string) => {
    window.open(`/api/data/download?sourceKey=${sourceKey}`, "_blank");
  }, []);

  const statusIcon = (status: ImportStatus) => {
    switch (status) {
      case "uploading": return <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />;
      case "validating": return <RefreshCw className="h-4 w-4 animate-spin text-amber-500" />;
      case "success": return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case "error": return <XCircle className="h-4 w-4 text-red-500" />;
      default: return <Upload className="h-4 w-4 text-muted" />;
    }
  };

  const statusBadge = (status: ImportStatus) => {
    const config = {
      idle: { tone: "neutral" as const, label: "Ready" },
      uploading: { tone: "info" as const, label: "Uploading…" },
      validating: { tone: "warning" as const, label: "Validating…" },
      success: { tone: "success" as const, label: "Imported" },
      error: { tone: "danger" as const, label: "Error" },
    };
    const c = config[status];
    return <Badge tone={c.tone}>{c.label}</Badge>;
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Import Data" eyebrow="Manage care data sources">
        Upload CSV, JSON, or JSONL files to add records to any care data source. Files are appended to the existing data, the database is automatically re-seeded.
      </PageHeader>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {entries.map((entry) => {
          const status = statuses[entry.key] || "idle";
          const result = results[entry.key];

          return (
            <div key={entry.key} className="rounded-lg border border-border bg-white shadow-panel overflow-hidden">
              {/* Header */}
              <div className="border-b border-border bg-surface p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-ink">{entry.specName}</h3>
                    <p className="mt-0.5 text-xs text-muted">{entry.label} · {counts[entry.key] || 0} records</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Badge tone="info">{entry.columns.length} cols</Badge>
                    {statusBadge(status)}
                  </div>
                </div>
              </div>

              {/* Columns */}
              <details className="border-b border-border">
                <summary className="flex cursor-pointer items-center gap-2 px-4 py-2 text-xs font-medium text-ink hover:bg-surface/50">
                  <code className="text-info">schema</code>
                  <span className="font-normal text-muted">({entry.columns.length} columns)</span>
                </summary>
                <div className="px-4 pb-3 pt-1">
                  <div className="flex flex-wrap gap-1">
                    {entry.columns.map((col) => (
                      <code key={col} className="rounded bg-surface px-1.5 py-0.5 text-[10px] font-mono text-muted">{col}</code>
                    ))}
                  </div>
                </div>
              </details>

              {/* Upload zone */}
              <div className="border-b border-border bg-slate-50 px-4 py-3">
                <label
                  className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-4 transition-colors ${
                    status === "uploading" || status === "validating"
                      ? "border-blue-200 bg-blue-50"
                      : "border-slate-300 bg-white hover:border-blue-300 hover:bg-blue-50"
                  }`}
                >
                  <input
                    ref={(el) => { fileInputRefs.current[entry.key] = el; }}
                    type="file"
                    accept=".csv,.json,.jsonl"
                    className="hidden"
                    onChange={(e) => handleFileSelect(entry.key, e.target.files?.[0] || null)}
                    disabled={status === "uploading" || status === "validating"}
                  />
                  <div className="flex flex-col items-center gap-1.5">
                    {statusIcon(status)}
                    <span className="text-xs font-medium text-ink">
                      {status === "uploading" ? "Uploading…" :
                       status === "validating" ? "Validating…" :
                       status === "success" ? "Upload more" :
                       "Click to upload"}
                    </span>
                    <span className="text-[10px] text-muted">CSV, JSON, or JSONL</span>
                  </div>
                </label>
              </div>

              {/* Result */}
              {result && (
                <div className={`px-4 py-2.5 text-xs ${
                  result.success ? "bg-green-50" : "bg-red-50"
                }`}>
                  <div className="flex items-center gap-1.5 font-medium">
                    {result.success ? (
                      <><CheckCircle2 className="h-3.5 w-3.5 text-green-600" /><span className="text-green-800">Imported {result.recordsImported} records</span></>
                    ) : (
                      <><XCircle className="h-3.5 w-3.5 text-red-600" /><span className="text-red-800">Import failed</span></>
                    )}
                  </div>
                  {result.validationErrors.length > 0 && (
                    <ul className="mt-1 space-y-0.5 text-red-700">
                      {result.validationErrors.map((e, i) => (
                        <li key={i} className="flex items-start gap-1"><AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" /><span>{e}</span></li>
                      ))}
                    </ul>
                  )}
                  {result.error && !result.validationErrors.length && (
                    <p className="mt-1 text-red-700">{result.error}</p>
                  )}
                  {result.dbSeeded === false && result.success && (
                    <p className="mt-1 text-amber-700">Warning: Database reseeding failed. Some queries may show stale data.</p>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-between px-4 py-2.5">
                <button
                  onClick={() => handleDownload(entry.key)}
                  className="inline-flex items-center gap-1.5 rounded px-2.5 py-1.5 text-[10px] font-medium text-ink hover:bg-surface border border-border transition-colors"
                >
                  <Download className="h-3 w-3" />
                  Download CSV
                </button>
                <button
                  onClick={refreshCounts}
                  disabled={refreshing}
                  className="inline-flex items-center gap-1.5 rounded px-2.5 py-1.5 text-[10px] font-medium text-muted hover:bg-surface border border-border transition-colors"
                >
                  <RefreshCw className={`h-3 w-3 ${refreshing ? "animate-spin" : ""}`} />
                  Refresh
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary */}
      <div className="rounded-lg border border-border bg-surface p-5">
        <h3 className="font-semibold text-ink">About data importing</h3>
        <ul className="mt-2 space-y-1.5 text-sm text-muted">
          <li>- Uploaded records are appended to the existing JSONL and CSV data files.</li>
          <li>- The SQLite database is automatically re-seeded after each import.</li>
          <li>- Column names in your file must match the schema. Unknown columns are ignored.</li>
          <li>- Required columns and data types are validated before import.</li>
          <li>- After import, Coral CLI and SQLite queries will reflect the new data.</li>
        </ul>
      </div>
    </div>
  );
}
