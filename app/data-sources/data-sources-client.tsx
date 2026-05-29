"use client";

import { useState, useEffect, useCallback } from "react";
import { PageHeader, Badge } from "@/components/ui";

interface SourceEntry {
  key: string;
  label: string;
  specName: string;
  dir: string;
  table: string;
  manifestYaml: string | null;
  sampleRows: Record<string, any>[];
  rowCount: number;
}

interface ActionLogEntry {
  action: string;
  command: string;
  stdout: string;
  stderr: string;
  success: boolean;
  timestamp: string;
}

type SourceStatus = "checking" | "not_registered" | "lint_ok" | "registered" | "tests_passed" | "error";

export default function DataSourcesClient({ entries }: { entries: SourceEntry[] }) {
  const [statuses, setStatuses] = useState<Record<string, SourceStatus>>({});
  const [actionLogs, setActionLogs] = useState<Record<string, ActionLogEntry[]>>({});
  const [loading, setLoading] = useState<Record<string, string | null>>({});
  const [queryResults, setQueryResults] = useState<Record<string, Record<string, any>[] | null>>({});
  const [mode, setMode] = useState<string>("coral_cli");

  useEffect(() => {
    const initial: Record<string, SourceStatus> = {};
    entries.forEach(e => { initial[e.specName] = "checking"; });
    setStatuses(initial);

    fetch("/api/coral/source-list")
      .then(r => r.json())
      .then(data => {
        setMode(data.mode || "coral_cli");
        const registered = new Set<string>((data.careOpsSources || []).map((s: any) => s.name));
        const updated: Record<string, SourceStatus> = {};
        entries.forEach(e => {
          updated[e.specName] = registered.has(e.specName) ? "registered" : "not_registered";
        });
        setStatuses(updated);
      })
      .catch(() => {
        const fallback: Record<string, SourceStatus> = {};
        entries.forEach(e => { fallback[e.specName] = "not_registered"; });
        setStatuses(fallback);
      });
  }, [entries]);

  const runAction = useCallback(async (specName: string, action: string) => {
    setLoading(prev => ({ ...prev, [specName]: action }));
    setActionLogs(prev => ({ ...prev, [specName]: prev[specName] || [] }));

    try {
      const res = await fetch("/api/coral/source-action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, sourceName: specName }),
      });
      const data = await res.json();

      const logEntry: ActionLogEntry = {
        action,
        command: data.command || "",
        stdout: data.stdout || "",
        stderr: data.stderr || "",
        success: data.success ?? !data.error,
        timestamp: data.timestamp || new Date().toISOString(),
      };

      setActionLogs(prev => ({
        ...prev,
        [specName]: [...(prev[specName] || []), logEntry],
      }));

      if (action === "query" && Array.isArray(data.rows)) {
        setQueryResults(prev => ({ ...prev, [specName]: data.rows }));
      }

      if (action === "lint" && logEntry.success) {
        setStatuses(prev => ({ ...prev, [specName]: "lint_ok" }));
      } else if (action === "add" && logEntry.success) {
        setStatuses(prev => ({ ...prev, [specName]: "registered" }));
      } else if (action === "test" && logEntry.success) {
        setStatuses(prev => ({ ...prev, [specName]: "tests_passed" }));
      } else if (!logEntry.success) {
        setStatuses(prev => ({ ...prev, [specName]: "error" }));
      }
    } catch (err: any) {
      setActionLogs(prev => ({
        ...prev,
        [specName]: [
          ...(prev[specName] || []),
          { action, command: "", stdout: "", stderr: err.message, success: false, timestamp: new Date().toISOString() },
        ],
      }));
      setStatuses(prev => ({ ...prev, [specName]: "error" }));
    } finally {
      setLoading(prev => ({ ...prev, [specName]: null }));
    }
  }, []);

  const statusBadge = (status: SourceStatus) => {
    const config: Record<SourceStatus, { tone: "info" | "success" | "warning" | "danger" | "neutral"; label: string }> = {
      checking: { tone: "neutral", label: "Checking…" },
      not_registered: { tone: "warning", label: "Not registered" },
      lint_ok: { tone: "info", label: "Lint OK" },
      registered: { tone: "info", label: "Registered" },
      tests_passed: { tone: "success", label: "Tests passed" },
      error: { tone: "danger", label: "Error" },
    };
    const c = config[status];
    return <Badge tone={c.tone}>{c.label}</Badge>;
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Coral Source Specs" eyebrow="Interactive source pipeline">
        9 Coral-compatible source specs. Use the action buttons to lint, register, test, and query each source via the real Coral CLI.
      </PageHeader>

      <div className="mb-4 flex items-center gap-2">
        <span className="text-xs text-muted">Runtime:</span>
        <span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-info">
          {mode === "coral_cli" ? "Real Coral CLI" : mode}
        </span>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {entries.map((entry) => {
          const status = statuses[entry.specName] || "checking";
          const isLoading = loading[entry.specName];
          const logs = actionLogs[entry.specName] || [];
          const results = queryResults[entry.specName];

          return (
            <div key={entry.key} className="rounded-lg border border-border bg-white shadow-panel overflow-hidden">
              {/* Header */}
              <div className="border-b border-border bg-surface p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-ink">{entry.specName}</h3>
                    <p className="mt-0.5 text-xs text-muted">{entry.label} · {entry.rowCount} rows</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Badge tone="success">JSONL</Badge>
                    {statusBadge(status)}
                  </div>
                </div>
              </div>

              {/* Manifest YAML */}
              {entry.manifestYaml && (
                <details className="border-b border-border">
                  <summary className="flex cursor-pointer items-center gap-2 px-4 py-2 text-xs font-medium text-ink hover:bg-surface/50">
                    <code className="text-info">manifest.yaml</code>
                    <span className="font-normal text-muted">(dsl_version: 3)</span>
                  </summary>
                  <pre className="max-h-60 overflow-x-auto px-4 pb-3 pt-1 font-mono text-[10px] leading-4 text-muted">
                    {entry.manifestYaml}
                  </pre>
                </details>
              )}

              {/* Action buttons */}
              <div className="border-b border-border bg-slate-50 px-4 py-2.5">
                <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted">Actions</p>
                <div className="flex flex-wrap gap-1.5">
                  {(["lint", "add", "test", "query"] as const).map((action) => {
                    const busy = isLoading === action;
                    return (
                      <button
                        key={action}
                        disabled={!!isLoading}
                        onClick={() => runAction(entry.specName, action)}
                        className={`rounded px-2 py-1 text-[10px] font-mono font-medium transition-colors ${
                          busy
                            ? "bg-slate-300 text-slate-500 cursor-not-allowed"
                            : "bg-white border border-border text-ink hover:bg-info hover:text-white hover:border-info"
                        }`}
                      >
                        {busy ? `${action}…` : action}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Query results */}
              {results && results.length > 0 && (
                <div className="border-b border-border bg-blue-50 px-4 py-2">
                  <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-info">Query results</p>
                  <div className="overflow-x-auto rounded bg-white p-1.5">
                    <table className="w-full text-[10px]">
                      <thead>
                        <tr className="border-b border-border">
                          {Object.keys(results[0]).map(col => (
                            <th key={col} className="px-1.5 py-0.5 text-left font-semibold text-muted">{col}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {results.map((row, ri) => (
                          <tr key={ri} className="border-b border-border/50 last:border-0">
                            {Object.values(row).map((val, ci) => (
                              <td key={ci} className="px-1.5 py-0.5 text-ink">{String(val).substring(0, 24)}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Execution log */}
              {logs.length > 0 && (
                <details className="border-b border-border" open>
                  <summary className="flex cursor-pointer items-center gap-2 px-4 py-2 text-[10px] font-semibold uppercase tracking-wider text-muted hover:bg-surface/50">
                    History ({logs.length})
                  </summary>
                  <div className="max-h-48 overflow-y-auto px-4 pb-3">
                    {logs.map((log, i) => (
                      <div key={i} className={`mt-1.5 rounded p-2 text-[10px] font-mono leading-4 ${
                        log.success ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"
                      }`}>
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold">{log.action}</span>
                          <span className="text-muted">{new Date(log.timestamp).toLocaleTimeString()}</span>
                          {log.success ? <span className="text-green-600">\u2713</span> : <span className="text-red-600">\u2717</span>}
                        </div>
                        {log.command && <div className="mt-0.5 text-muted">$ {log.command}</div>}
                        {log.stdout && <div className="mt-0.5 whitespace-pre-wrap">{log.stdout.substring(0, 200)}</div>}
                        {log.stderr && <div className="mt-0.5 text-red-600">{log.stderr.substring(0, 200)}</div>}
                      </div>
                    ))}
                  </div>
                </details>
              )}

              {/* Sample data */}
              {entry.sampleRows.length > 0 && (
                <div className="px-4 py-3">
                  <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted">Sample data</p>
                  {entry.sampleRows.map((row, i) => (
                    <div key={i} className="mb-1.5 rounded bg-surface p-2 last:mb-0">
                      <div className="flex flex-wrap gap-x-3 gap-y-0.5">
                        {Object.entries(row).slice(0, 4).map(([col, val]) => (
                          <span key={col} className="text-[10px]">
                            <span className="text-muted">{col}:</span>{" "}
                            <span className="font-mono text-ink">{String(val).substring(0, 28)}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Pipeline summary */}
      <div className="rounded-lg border border-border bg-surface p-5">
        <h3 className="font-semibold text-ink">Real Coral Source Spec Pipeline</h3>
        <p className="mt-1 mb-4 text-sm text-muted">Each spec progresses through lint → add → test → query. Click the action buttons above to execute each step against the real Coral CLI.</p>
        <div className="space-y-3">
          {[
            { cmd: "coral source lint", desc: "Validate the manifest schema before adding it to the workspace", why: "Catches YAML errors, missing fields, and invalid column types before the source is installed" },
            { cmd: "coral source add --file", desc: "Register the source with Coral, store credentials, install tables", why: "After this, the source appears in coral.tables and can be queried via coral sql" },
            { cmd: "coral source test", desc: "Run declared test_queries against the live source", why: "Confirms tables are accessible, queries return expected shapes, and credentials are valid" },
            { cmd: "coral sql 'SELECT * FROM ... LIMIT 5'", desc: "Direct SQL query against the spec's table", why: "Validates columns, types, and data content are as expected" },
          ].map((step, i) => (
            <div key={i} className="rounded border border-border bg-white p-3">
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-info text-[10px] font-bold text-white">{i + 1}</div>
                <code className="font-mono text-xs font-medium text-info break-all">{step.cmd}</code>
              </div>
              <p className="ml-8 mt-1.5 text-xs text-muted">{step.desc}</p>
              <p className="ml-8 mt-0.5 text-[10px] text-muted"><strong className="text-ink">Why:</strong> {step.why}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
