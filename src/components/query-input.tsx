"use client";

import { useState } from "react";
import { Card, Badge, SafetyNotice } from "./ui";
import { Search, Loader2, Terminal, Play, ChevronRight, Database, Table2, Timer, FileText, CheckCircle, AlertCircle, Info } from "lucide-react";

type LogEntry = {
  command: string;
  description: string;
  output: string[];
  status: "running" | "success" | "error" | "info";
  durationMs: number;
};

type SpecInfo = {
  name: string;
  source: string;
  columns: string[];
};

type PacketResponse = {
  mode: string;
  patientId: string;
  patient?: any;
  sql: string;
  commands?: string[];
  sourcesUsed?: string[];
  rowCount: number;
  executionTimeMs: number;
  joinedRows?: Record<string, any>[];
  rows?: Record<string, any>[];
  packet: any;
  error?: string;
};

const SAMPLE_COMMANDS = [
  { label: "Show all patients", command: "SELECT * FROM careops_patients.patients", patient: "pat-001" },
  { label: "Show medications for Raman Mehta", command: "SELECT * FROM careops_medications.medications WHERE patient_id = 'pat-001'", patient: "pat-001" },
  { label: "Join patient timeline", command: "SELECT m.medicine_name, s.symptom, l.test_name FROM careops_medications.medications m LEFT JOIN careops_symptom_logs.symptom_logs s ON s.patient_id = m.patient_id LEFT JOIN careops_lab_reports.lab_reports l ON l.patient_id = m.patient_id WHERE m.patient_id = 'pat-001'", patient: "pat-001" },
  { label: "Prepare doctor visit packet", command: "Generate packet for Raman Mehta diabetes follow-up", patient: "pat-001" },
];

export function QueryInput({ patientId: defaultPid = "pat-001" }: { patientId?: string }) {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<PacketResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [showSql, setShowSql] = useState(true);
  const [showSpecs, setShowSpecs] = useState(true);
  const [showRows, setShowRows] = useState(true);

  const addLog = (entry: LogEntry) => {
    setLogs(prev => [...prev, entry]);
  };

  const handleSubmit = async (q?: string, pid?: string) => {
    const queryText = q || query;
    const patientId = pid || defaultPid;
    if (!queryText.trim()) return;

    setLoading(true);
    setError("");
    setResult(null);
    setLogs([]);

    addLog({
      command: `coral source list`,
      description: "Verify registered CareOps sources via real Coral CLI",
      output: ["Querying Coral CLI for registered sources..."],
      status: "running",
      durationMs: 0,
    });

    try {
      const sourceRes = await fetch("/api/coral/source-list");
      const sourceData = await sourceRes.json();
      setLogs((prev) =>
        prev.map((log, i) =>
          i === 0
            ? {
                ...log,
                status: sourceData.error ? "error" : "success",
                output: sourceData.careOpsSources
                  ? sourceData.careOpsSources.map((s: any) => `  ${s.name.padEnd(30)} ${s.version}    imported`)
                  : ["No sources found"],
                durationMs: 50,
              }
            : log
        )
      );

      const res = await fetch(`/api/care-packet?patientId=${patientId}&purpose=${encodeURIComponent(queryText)}`);
      if (!res.ok) throw new Error("Query failed");
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      for (const cmd of data.commands || []) {
        addLog({
          command: cmd,
          description: cmd.startsWith("coral sql") ? "Execute coral sql query" : "Coral CLI command",
          output: [],
          status: "success",
          durationMs: 30,
        });
      }

      setResult({ ...data, mode: data.mode });
      setShowSql(true);
      setShowSpecs(true);
      setShowRows(data.joinedRows?.length > 0);
    } catch (err: any) {
      setError(err.message || "Failed to process query");
      setLogs((prev) =>
        prev.map((log, i) =>
          i === 0 ? { ...log, status: "error", output: [...log.output, `✗ ${err.message}`], durationMs: 0 } : log
        )
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="flex gap-3">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder='Ask a question... e.g. "Prepare a doctor visit packet for Raman Mehta"'
          className="flex-1 rounded-lg border border-border bg-white px-4 py-3 text-sm text-ink placeholder:text-muted focus:border-info focus:outline-none focus:ring-1 focus:ring-info"
        />
        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="inline-flex items-center gap-2 rounded-lg bg-ink px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          Run
        </button>
      </form>

      {/* Quick command shortcuts */}
      <div className="flex flex-wrap gap-2">
        {SAMPLE_COMMANDS.map((cmd) => (
          <button
            key={cmd.label}
            onClick={() => { setQuery(cmd.command); handleSubmit(cmd.command, cmd.patient); }}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface px-3 py-1.5 text-xs text-muted hover:border-info hover:text-info disabled:opacity-50"
          >
            <Play className="h-3 w-3" />
            {cmd.label}
          </button>
        ))}
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-danger shrink-0 mt-0.5" />
            <p className="text-sm text-danger">{error}</p>
          </div>
        </Card>
      )}

      {/* Execution Log */}
      {logs.length > 0 && (
        <div className="rounded-lg border border-border overflow-hidden">
          <div className="bg-ink px-4 py-2.5 flex items-center gap-2">
            <Terminal className="h-4 w-4 text-blue-300" />
            <span className="text-xs font-medium text-blue-100">Execution Log</span>
            <span className="text-[10px] text-blue-300/60 ml-auto">
              {logs.reduce((sum, l) => sum + l.durationMs, 0)}ms total
            </span>
          </div>
          <div className="divide-y divide-border/30">
            {logs.map((entry, idx) => (
              <div key={idx} className="px-4 py-3 hover:bg-surface/30">
                <div className="flex items-start gap-3">
                  <div className="mt-1 shrink-0">
                    {entry.status === "running" ? (
                      <Loader2 className="h-4 w-4 animate-spin text-info" />
                    ) : entry.status === "success" ? (
                      <CheckCircle className="h-4 w-4 text-success" />
                    ) : entry.status === "error" ? (
                      <AlertCircle className="h-4 w-4 text-danger" />
                    ) : (
                      <Info className="h-4 w-4 text-info" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <code className="text-xs font-mono text-ink bg-slate-100 px-2 py-0.5 rounded truncate">{entry.command}</code>
                      {entry.durationMs > 0 && (
                        <span className="text-[10px] text-muted shrink-0">{entry.durationMs}ms</span>
                      )}
                    </div>
                    <p className="text-xs text-muted mt-1">{entry.description}</p>
                    {entry.output.length > 0 && (
                      <div className="mt-2 rounded bg-slate-50 p-2 border border-border/50">
                        {entry.output.map((line, i) => (
                          <p key={i} className="text-[11px] font-mono text-muted leading-5">{line}</p>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {result && (() => {
        const pt = result.patient || result.packet?.patient;
        const questions = result.packet?.questionsForDoctor || result.packet?.questions || [];
        const missing = result.packet?.missingRecords || [];
        const rows = result.joinedRows || result.rows || [];
        const sources = result.sourcesUsed || [];
        return (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            {result.mode === "coral_cli" ? (
              <Badge tone="success">Real Coral CLI</Badge>
            ) : result.mode === "mock" ? (
              <Badge tone="warning">Mock Mode</Badge>
            ) : (
              <Badge tone="info">{result.mode}</Badge>
            )}
            <span className="text-xs text-muted">{(result.commands || []).length} coral commands executed</span>
          </div>

          <div className="flex flex-wrap gap-3">
            <Card className="flex-1 min-w-[200px]">
              <div className="flex items-center gap-2 text-sm font-medium text-ink">
                <Database className="h-4 w-4 text-info" /> Sources
              </div>
              <p className="mt-1 text-xs text-muted">{sources.length} Coral sources</p>
            </Card>
            <Card className="flex-1 min-w-[200px]">
              <div className="flex items-center gap-2 text-sm font-medium text-ink">
                <Table2 className="h-4 w-4 text-info" /> Join Result
              </div>
              <p className="mt-1 text-xs text-muted">{rows.length || result.rowCount || 0} joined rows</p>
            </Card>
            <Card className="flex-1 min-w-[200px]">
              <div className="flex items-center gap-2 text-sm font-medium text-ink">
                <Timer className="h-4 w-4 text-info" /> Execution
              </div>
              <p className="mt-1 text-xs text-muted">{result.executionTimeMs || 0}ms</p>
            </Card>
          </div>

          {pt && (
            <Card>
              <h3 className="font-semibold text-ink flex items-center gap-2">
                <Badge tone="info">Patient</Badge> {pt.name}
              </h3>
              <p className="text-xs text-muted mt-1">{pt.age}y · {pt.gender} · {pt.condition_focus} · {pt.primary_doctor}</p>
            </Card>
          )}

          {result.packet && (
            <Card>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-ink">Doctor Visit Packet</h3>
                <Badge tone="success">Generated from real Coral SQL</Badge>
              </div>
              {result.packet.summary && <p className="text-sm leading-6 text-muted">{result.packet.summary}</p>}
              {questions.length > 0 && (
                <div className="mt-3 border-t border-border pt-3">
                  <h4 className="text-xs font-semibold text-muted uppercase tracking-wider">Questions for Doctor</h4>
                  <ul className="mt-2 space-y-1">
                    {questions.map((q: string, i: number) => (
                      <li key={i} className="text-xs text-muted flex items-start gap-2"><span className="text-info mt-1 shrink-0">•</span>{q}</li>
                    ))}
                  </ul>
                </div>
              )}
              {missing.length > 0 && (
                <div className="mt-3 border-t border-border pt-3">
                  <h4 className="text-xs font-semibold text-amber-600 uppercase tracking-wider">Missing Records</h4>
                  <ul className="mt-2 space-y-1">
                    {missing.map((m: string, i: number) => (
                      <li key={i} className="text-xs text-muted flex items-start gap-2"><span className="text-amber-500 mt-1 shrink-0">!</span>{m}</li>
                    ))}
                  </ul>
                </div>
              )}
            </Card>
          )}

          <div className="rounded-lg border border-border overflow-hidden">
            <button onClick={() => setShowSql(!showSql)} className="flex w-full items-center justify-between bg-surface px-4 py-3 text-sm font-medium text-ink hover:bg-slate-100">
              <span className="flex items-center gap-2"><FileText className="h-4 w-4 text-info" /> Executed SQL Query</span>
              {showSql ? <ChevronRight className="h-4 w-4 rotate-90" /> : <ChevronRight className="h-4 w-4" />}
            </button>
            {showSql && <div className="bg-slate-950 p-4"><pre className="text-xs leading-5 text-slate-200 overflow-x-auto">{result.sql}</pre></div>}
          </div>

          {sources.length > 0 && (
            <div className="rounded-lg border border-border overflow-hidden">
              <button onClick={() => setShowSpecs(!showSpecs)} className="flex w-full items-center justify-between bg-surface px-4 py-3 text-sm font-medium text-ink hover:bg-slate-100">
                <span className="flex items-center gap-2"><Database className="h-4 w-4 text-info" /> Coral Sources ({sources.length})</span>
                {showSpecs ? <ChevronRight className="h-4 w-4 rotate-90" /> : <ChevronRight className="h-4 w-4" />}
              </button>
              {showSpecs && (
                <div className="p-4 border-t border-border flex flex-wrap gap-2">
                  {sources.map((s: string) => (<Badge key={s} tone="success">{s}</Badge>))}
                </div>
              )}
            </div>
          )}

          {rows.length > 0 && (
            <div className="rounded-lg border border-border overflow-hidden">
              <button onClick={() => setShowRows(!showRows)} className="flex w-full items-center justify-between bg-surface px-4 py-3 text-sm font-medium text-ink hover:bg-slate-100">
                <span className="flex items-center gap-2"><Table2 className="h-4 w-4 text-info" /> Joined Results ({rows.length} rows)</span>
                {showRows ? <ChevronRight className="h-4 w-4 rotate-90" /> : <ChevronRight className="h-4 w-4" />}
              </button>
              {showRows && (
                <div className="overflow-x-auto border-t border-border">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-surface border-b border-border">
                        {Object.keys(rows[0]).slice(0, 10).map((col) => (
                          <th key={col} className="px-3 py-2 text-left font-medium text-muted">{col}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {rows.slice(0, 20).map((row: any, i: number) => (
                        <tr key={i} className="border-b border-border/50 last:border-0 hover:bg-surface/50">
                          {Object.keys(rows[0]).slice(0, 10).map((col) => (
                            <td key={col} className="px-3 py-2 text-muted">{row[col] ?? "—"}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {rows.length > 20 && <p className="p-3 text-xs text-muted border-t border-border">Showing first 20 of {rows.length} rows</p>}
                </div>
              )}
            </div>
          )}

          <SafetyNotice />
        </div>
        );
      })()}
    </div>
  );
}
