"use client";

import { useState, useRef, useCallback } from "react";
import { PageHeader, Badge } from "@/components/ui";
import { Upload, Download, CheckCircle2, XCircle, AlertTriangle, RefreshCw, Mail, MessageSquare, FileText, Calendar } from "lucide-react";

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

interface RealSourceResult {
  success: boolean;
  sourceLabel: string;
  recordsImported: number;
  targetTable: string;
  errors: string[];
  warnings: string[];
  doctorChatsImported?: number;
  familyNotesImported?: number;
  prescriptionsImported?: number;
  labReportsImported?: number;
  textPreview?: string;
  totalMessages?: number;
}

type ImportStatus = "idle" | "uploading" | "validating" | "success" | "error";
type RealSourceStatus = "idle" | "connecting" | "success" | "error";

const REAL_SOURCES = [
  { key: "whatsapp", label: "WhatsApp Chat", icon: MessageSquare, description: "Upload a WhatsApp export .txt file. Messages from doctors go to Doctor Chats, family messages go to Family Notes.", accept: ".txt", endpoint: "/api/real-sources/whatsapp" },
  { key: "pdf", label: "PDF Prescription / Lab", icon: FileText, description: "Upload a PDF or .txt file containing prescription or lab report text. Medicines and test values are extracted automatically.", accept: ".pdf,.txt", endpoint: "/api/real-sources/pdf" },
  { key: "gmail", label: "Gmail (Doctor Emails)", icon: Mail, description: "Pull doctor-related emails from your Gmail inbox via Coral. Requires Gmail Coral source spec + OAuth token.", accept: "", endpoint: "/api/real-sources/gmail" },
  { key: "calendar", label: "Google Calendar", icon: Calendar, description: "Pull medical appointments from your Google Calendar via Coral. Requires Google Calendar Coral source spec + OAuth token.", accept: "", endpoint: "/api/real-sources/calendar" },
];

export default function DataImportClient({ entries }: { entries: SourceEntry[] }) {
  const [statuses, setStatuses] = useState<Record<string, ImportStatus>>({});
  const [results, setResults] = useState<Record<string, ImportResult | null>>({});
  const [counts, setCounts] = useState<Record<string, number>>(
    Object.fromEntries(entries.map((e) => [e.key, e.rowCount]))
  );
  const [refreshing, setRefreshing] = useState(false);
  const [realStatuses, setRealStatuses] = useState<Record<string, RealSourceStatus>>({});
  const [realResults, setRealResults] = useState<Record<string, RealSourceResult | null>>({});
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

  const handleRealSourceUpload = useCallback(async (sourceKey: string, file: File | null) => {
    if (!file) return;
    setRealStatuses((prev) => ({ ...prev, [sourceKey]: "connecting" }));
    setRealResults((prev) => ({ ...prev, [sourceKey]: null }));

    const formData = new FormData();
    formData.append("file", file);

    try {
      const source = REAL_SOURCES.find((s) => s.key === sourceKey);
      const res = await fetch(source!.endpoint, { method: "POST", body: formData });
      const result: RealSourceResult = await res.json();
      setRealResults((prev) => ({ ...prev, [sourceKey]: result }));
      setRealStatuses((prev) => ({ ...prev, [sourceKey]: result.success ? "success" : "error" }));
      if (result.success) await refreshCounts();
    } catch (err: any) {
      setRealResults((prev) => ({
        ...prev,
        [sourceKey]: { success: false, sourceLabel: sourceKey, recordsImported: 0, targetTable: "", errors: [err.message], warnings: [] },
      }));
      setRealStatuses((prev) => ({ ...prev, [sourceKey]: "error" }));
    }
  }, [refreshCounts]);

  const handleRealSourceConnect = useCallback(async (sourceKey: string) => {
    setRealStatuses((prev) => ({ ...prev, [sourceKey]: "connecting" }));
    setRealResults((prev) => ({ ...prev, [sourceKey]: null }));

    try {
      const source = REAL_SOURCES.find((s) => s.key === sourceKey);
      const res = await fetch(source!.endpoint, { method: "POST" });
      const result: RealSourceResult = await res.json();
      setRealResults((prev) => ({ ...prev, [sourceKey]: result }));
      setRealStatuses((prev) => ({ ...prev, [sourceKey]: result.success ? "success" : "error" }));
      if (result.success) await refreshCounts();
    } catch (err: any) {
      setRealResults((prev) => ({
        ...prev,
        [sourceKey]: { success: false, sourceLabel: sourceKey, recordsImported: 0, targetTable: "", errors: [err.message], warnings: [] },
      }));
      setRealStatuses((prev) => ({ ...prev, [sourceKey]: "error" }));
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
    <div className="space-y-8">
      <PageHeader title="Import Data" eyebrow="Manage care data sources">
        <p className="text-sm text-muted">Upload CSV/JSON/JSONL files or connect real data sources. All data is appended to existing records and the database is automatically re-seeded.</p>
      </PageHeader>

      {/* Real Sources Section */}
      <section>
        <h2 className="mb-3 text-lg font-semibold text-ink flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-green-500" />
          Real Data Sources
        </h2>
        <p className="mb-4 text-sm text-muted">Import real data from WhatsApp, PDFs, email, and calendar. Each source parses and maps data into the correct care data tables.</p>
        <div className="grid gap-4 md:grid-cols-2">
          {REAL_SOURCES.map((source) => {
            const status = realStatuses[source.key] || "idle";
            const result = realResults[source.key];
            const Icon = source.icon;
            const needsFile = source.key === "whatsapp" || source.key === "pdf";
            const needsConnect = source.key === "gmail" || source.key === "calendar";

            return (
              <div key={source.key} className="rounded-lg border border-border bg-white shadow-panel overflow-hidden">
                <div className="border-b border-border bg-surface p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-ink">{source.label}</h3>
                        <p className="mt-0.5 text-xs text-muted">{source.description}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="px-4 py-3">
                  {needsFile && (
                    <label className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-3 transition-colors ${
                      status === "connecting" ? "border-blue-200 bg-blue-50" : "border-slate-300 bg-white hover:border-blue-300 hover:bg-blue-50"
                    }`}>
                      <input
                        ref={(el) => { fileInputRefs.current[source.key] = el; }}
                        type="file"
                        accept={source.accept}
                        className="hidden"
                        onChange={(e) => handleRealSourceUpload(source.key, e.target.files?.[0] || null)}
                        disabled={status === "connecting"}
                      />
                      <div className="flex flex-col items-center gap-1">
                        {status === "connecting" ? (
                          <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />
                        ) : (
                          <Upload className="h-4 w-4 text-muted" />
                        )}
                        <span className="text-xs font-medium text-ink">
                          {status === "connecting" ? "Processing…" : "Upload file"}
                        </span>
                        <span className="text-[10px] text-muted">{source.accept || "Select file"}</span>
                      </div>
                    </label>
                  )}

                  {needsConnect && (
                    <button
                      onClick={() => handleRealSourceConnect(source.key)}
                      disabled={status === "connecting"}
                      className="w-full rounded-lg border-2 border-dashed border-slate-300 bg-white p-3 text-center transition-colors hover:border-blue-300 hover:bg-blue-50 disabled:opacity-50"
                    >
                      {status === "connecting" ? (
                        <span className="flex items-center justify-center gap-2 text-xs font-medium text-blue-600">
                          <RefreshCw className="h-4 w-4 animate-spin" />
                          Connecting…
                        </span>
                      ) : (
                        <span className="text-xs font-medium text-ink">Click to import</span>
                      )}
                    </button>
                  )}
                </div>

                {result && (
                  <div className={`px-4 py-2.5 text-xs ${result.success ? "bg-green-50" : "bg-red-50"}`}>
                    {result.success ? (
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5 font-medium text-green-800">
                          <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                          Imported
                          {result.recordsImported > 0 && ` ${result.recordsImported} records`}
                          {result.doctorChatsImported !== undefined && ` (${result.doctorChatsImported} doctor chats, ${result.familyNotesImported} notes)`}
                          {result.prescriptionsImported !== undefined && ` (${result.prescriptionsImported} prescriptions, ${result.labReportsImported} lab reports)`}
                        </div>
                        {result.warnings?.map((w, i) => (
                          <p key={i} className="flex items-start gap-1 text-amber-700">
                            <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />
                            {w}
                          </p>
                        ))}
                      </div>
                    ) : (
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5 font-medium text-red-800">
                          <XCircle className="h-3.5 w-3.5 text-red-600" />
                          Failed
                        </div>
                        {result.errors?.map((e, i) => (
                          <p key={i} className="flex items-start gap-1 text-red-700">
                            <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />
                            {e}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Divider */}
      <div className="border-t border-border" />

      {/* CSV/JSON Upload Section */}
      <section>
        <h2 className="mb-3 text-lg font-semibold text-ink flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-amber-500" />
          Manual Upload (CSV / JSON / JSONL)
        </h2>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {entries.map((entry) => {
            const status = statuses[entry.key] || "idle";
            const result = results[entry.key];

            return (
              <div key={entry.key} className="rounded-lg border border-border bg-white shadow-panel overflow-hidden">
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

                <div className="border-b border-border bg-slate-50 px-4 py-3">
                  <label className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-4 transition-colors ${
                    status === "uploading" || status === "validating"
                      ? "border-blue-200 bg-blue-50"
                      : "border-slate-300 bg-white hover:border-blue-300 hover:bg-blue-50"
                  }`}>
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

                {result && (
                  <div className={`px-4 py-2.5 text-xs ${result.success ? "bg-green-50" : "bg-red-50"}`}>
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
      </section>

      <div className="rounded-lg border border-border bg-surface p-5">
        <h3 className="font-semibold text-ink">About data importing</h3>
        <ul className="mt-2 space-y-1.5 text-sm text-muted">
          <li>- <strong>Real Data Sources</strong>: WhatsApp exports, PDFs, Gmail, and Calendar importers parse and map data into the correct care tables automatically.</li>
          <li>- <strong>Manual Upload</strong>: CSV, JSON, and JSONL files are appended to existing records. Column names must match the schema.</li>
          <li>- The SQLite database is automatically re-seeded after each import.</li>
          <li>- Gmail and Calendar sources require Coral source specs with OAuth tokens (<code>coral source add --file ...</code>).</li>
          <li>- After import, all 3 query modes (Coral CLI, SQLite, mock) reflect the new data.</li>
        </ul>
      </div>
    </div>
  );
}
