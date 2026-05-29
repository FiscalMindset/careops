"use client";

import { useState } from "react";
import { Card, Badge, SafetyNotice } from "./ui";
import {
  Search,
  Loader2,
  Terminal,
  Play,
  Database,
  Table2,
  Timer,
  FileText,
  CheckCircle,
  AlertCircle,
  Info,
  User,
  FileSearch,
  Stethoscope,
  MessageSquare,
  Pill,
} from "lucide-react";

type TabId = "answer" | "execution" | "sql" | "sources";

type LogEntry = {
  command: string;
  description: string;
  output: string[];
  status: "running" | "success" | "error" | "info";
  durationMs: number;
};

type QueryResponse = {
  mode: string;
  query: string;
  patientId: string;
  patient?: any;
  commands?: string[];
  sql: string;
  rowCount: number;
  executionTimeMs: number;
  datasetStats?: any;
  rows?: Record<string, any>[];
  summary?: string;
  currentMedicines?: any[];
  recentLabs?: any[];
  symptomTimeline?: any[];
  doctorInstructions?: any[];
  refillEvidence?: any[];
  appointments?: any[];
  familyNotes?: any[];
  missingRecords?: string[];
  questionsForDoctor?: string[];
  error?: string;
};

const SAMPLE_COMMANDS = [
  { label: "Show all patients", command: "SELECT * FROM careops_patients.patients", patient: "pat-001" },
  {
    label: "Medications for Raman Mehta",
    command: "SELECT * FROM careops_medications.medications WHERE patient_id = 'pat-001'",
    patient: "pat-001",
  },
  {
    label: "Prepare doctor visit packet",
    command: "Generate packet for Raman Mehta diabetes follow-up",
    patient: "pat-001",
  },
  {
    label: "Symptom timeline for Leela Shah",
    command: "SELECT * FROM careops_symptom_logs.symptom_logs WHERE patient_id = 'pat-002'",
    patient: "pat-002",
  },
];

const TABS: { id: TabId; label: string; icon: any }[] = [
  { id: "answer", label: "Answer", icon: MessageSquare },
  { id: "execution", label: "Execution Log", icon: Terminal },
  { id: "sql", label: "SQL", icon: FileText },
  { id: "sources", label: "Sources", icon: Database },
];

function ModeBadge({ mode }: { mode: string }) {
  if (mode === "coral_cli") return <Badge tone="success">Real Coral CLI</Badge>;
  if (mode === "mock") return <Badge tone="warning">Mock Mode</Badge>;
  return <Badge tone="info">{mode}</Badge>;
}

function DataTable({ rows, max = 20 }: { rows: Record<string, any>[]; max?: number }) {
  if (!rows.length) return <p className="p-4 text-xs text-muted">No data</p>;
  const cols = Object.keys(rows[0]).slice(0, 10);
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="bg-surface border-b border-border">
            {cols.map((col) => (
              <th key={col} className="px-3 py-2 text-left font-medium text-muted whitespace-nowrap">
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.slice(0, max).map((row, i) => (
            <tr key={i} className="border-b border-border/50 last:border-0 hover:bg-surface/50">
              {cols.map((col) => (
                <td key={col} className="px-3 py-2 text-muted whitespace-nowrap">
                  {row[col] ?? "—"}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length > max && (
        <p className="p-3 text-xs text-muted border-t border-border">
          Showing first {max} of {rows.length} rows
        </p>
      )}
    </div>
  );
}

export function QueryInput({ patientId: defaultPid = "pat-001" }: { patientId?: string }) {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<QueryResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [activeTab, setActiveTab] = useState<TabId>("answer");
  const [selectedPid, setSelectedPid] = useState(defaultPid);

  const addLog = (entry: LogEntry) => setLogs((prev) => [...prev, entry]);

  const handleSubmit = async (q?: string, pid?: string) => {
    const queryText = q || query;
    const patientId = pid || selectedPid;
    if (!queryText.trim()) return;

    setLoading(true);
    setError("");
    setResult(null);
    setLogs([]);
    setActiveTab("answer");

    addLog({
      command: `GET /api/query?q=${encodeURIComponent(queryText)}&patientId=${patientId}`,
      description: "Query CareOps Coral sources via API",
      output: ["Sending query to CareOps API..."],
      status: "running",
      durationMs: 0,
    });

    try {
      const res = await fetch(`/api/query?q=${encodeURIComponent(queryText)}&patientId=${patientId}`);
      if (!res.ok) throw new Error(`Query failed with status ${res.status}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      setResult(data);
      setLogs((prev) =>
        prev.map((log, i) =>
          i === 0
            ? {
                ...log,
                status: "success",
                output: [`${data.rowCount || 0} rows returned in ${data.executionTimeMs || 0}ms`],
                durationMs: data.executionTimeMs || 0,
              }
            : log
        )
      );
    } catch (err: any) {
      setError(err.message || "Failed to process query");
      setLogs((prev) =>
        prev.map((log, i) =>
          i === 0
            ? { ...log, status: "error", output: [...log.output, `✗ ${err.message}`], durationMs: 0 }
            : log
        )
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit();
        }}
        className="flex gap-3"
      >
        <div className="flex-1 flex gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder='Ask a question... e.g. "Prepare a doctor visit packet for Raman Mehta"'
            className="flex-1 rounded-lg border border-border bg-white px-4 py-3 text-sm text-ink placeholder:text-muted focus:border-info focus:outline-none focus:ring-1 focus:ring-info"
          />
          <input
            type="text"
            value={selectedPid}
            onChange={(e) => setSelectedPid(e.target.value)}
            placeholder="Patient ID"
            className="w-32 rounded-lg border border-border bg-white px-3 py-3 text-sm text-ink placeholder:text-muted focus:border-info focus:outline-none focus:ring-1 focus:ring-info"
          />
        </div>
        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="inline-flex items-center gap-2 rounded-lg bg-ink px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          Run
        </button>
      </form>

      <div className="flex flex-wrap gap-2">
        {SAMPLE_COMMANDS.map((cmd) => (
          <button
            key={cmd.label}
            onClick={() => {
              setQuery(cmd.command);
              setSelectedPid(cmd.patient);
              handleSubmit(cmd.command, cmd.patient);
            }}
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

      {loading && (
        <Card>
          <div className="flex items-center gap-3">
            <Loader2 className="h-5 w-5 animate-spin text-info" />
            <p className="text-sm text-muted">Querying Coral sources...</p>
          </div>
        </Card>
      )}

      {result && !loading && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <ModeBadge mode={result.mode || "coral_cli"} />
            <span className="text-xs text-muted">
              {result.executionTimeMs || 0}ms &middot; {result.rowCount || 0} rows
            </span>
          </div>

          <div className="border-b border-border">
            <nav className="flex gap-0 -mb-px">
              {TABS.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium border-b-2 transition-colors ${
                      activeTab === tab.id
                        ? "border-info text-info"
                        : "border-transparent text-muted hover:text-ink hover:border-border"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Answer Tab */}
          {activeTab === "answer" && (
            <div className="space-y-4">
              {result.patient && (
                <Card>
                  <h3 className="font-semibold text-ink flex items-center gap-2">
                    <User className="h-4 w-4 text-info" />
                    {result.patient.name}
                  </h3>
                  <p className="text-xs text-muted mt-1">
                    {result.patient.age}y &middot; {result.patient.gender} &middot;{" "}
                    {result.patient.condition_focus} &middot; {result.patient.primary_doctor}
                  </p>
                </Card>
              )}

              {result.summary && (
                <Card>
                  <div className="flex items-center gap-2 mb-2">
                    <FileSearch className="h-4 w-4 text-info" />
                    <h3 className="font-semibold text-ink">Summary</h3>
                  </div>
                  <p className="text-sm leading-6 text-muted">{result.summary}</p>
                </Card>
              )}

              {result.currentMedicines && result.currentMedicines.length > 0 && (
                <Card>
                  <h3 className="font-semibold text-ink flex items-center gap-2 mb-2">
                    <Pill className="h-4 w-4 text-info" />
                    Current Medicines
                  </h3>
                  <DataTable rows={result.currentMedicines} max={10} />
                </Card>
              )}

              {result.recentLabs && result.recentLabs.length > 0 && (
                <Card>
                  <h3 className="font-semibold text-ink flex items-center gap-2 mb-2">
                    <Stethoscope className="h-4 w-4 text-info" />
                    Recent Labs
                  </h3>
                  <DataTable rows={result.recentLabs} max={10} />
                </Card>
              )}

              {result.symptomTimeline && result.symptomTimeline.length > 0 && (
                <Card>
                  <h3 className="font-semibold text-ink flex items-center gap-2 mb-2">
                    <ActivityIcon className="h-4 w-4 text-info" />
                    Symptom Timeline
                  </h3>
                  <DataTable rows={result.symptomTimeline} max={10} />
                </Card>
              )}

              {result.doctorInstructions && result.doctorInstructions.length > 0 && (
                <Card>
                  <h3 className="font-semibold text-ink flex items-center gap-2 mb-2">
                    <MessageSquare className="h-4 w-4 text-info" />
                    Doctor Instructions
                  </h3>
                  <DataTable rows={result.doctorInstructions} max={10} />
                </Card>
              )}

              {result.questionsForDoctor && result.questionsForDoctor.length > 0 && (
                <Card>
                  <h3 className="font-semibold text-ink flex items-center gap-2 mb-2">
                    <HelpIcon className="h-4 w-4 text-info" />
                    Questions for Doctor
                  </h3>
                  <ul className="space-y-1">
                    {result.questionsForDoctor.map((q: string, i: number) => (
                      <li key={i} className="text-xs text-muted flex items-start gap-2">
                        <span className="text-info mt-1 shrink-0">&bull;</span>
                        {q}
                      </li>
                    ))}
                  </ul>
                </Card>
              )}

              {result.missingRecords && result.missingRecords.length > 0 && (
                <Card className="border-amber-200 bg-amber-50">
                  <h3 className="font-semibold text-amber-700 flex items-center gap-2 mb-2">
                    <AlertCircle className="h-4 w-4 text-amber-500" />
                    Missing Records
                  </h3>
                  <ul className="space-y-1">
                    {result.missingRecords.map((m: string, i: number) => (
                      <li key={i} className="text-xs text-amber-600 flex items-start gap-2">
                        <span className="text-amber-500 mt-1 shrink-0">!</span>
                        {m}
                      </li>
                    ))}
                  </ul>
                </Card>
              )}

              {result.rows && result.rows.length > 0 && (
                <Card>
                  <h3 className="font-semibold text-ink flex items-center gap-2 mb-2">
                    <Table2 className="h-4 w-4 text-info" />
                    Raw Results ({result.rowCount} rows)
                  </h3>
                  <DataTable rows={result.rows} max={20} />
                </Card>
              )}

              <SafetyNotice />
            </div>
          )}

          {/* Execution Log Tab */}
          {activeTab === "execution" && (
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
                          <code className="text-xs font-mono text-ink bg-slate-100 px-2 py-0.5 rounded truncate">
                            {entry.command}
                          </code>
                          {entry.durationMs > 0 && (
                            <span className="text-[10px] text-muted shrink-0">{entry.durationMs}ms</span>
                          )}
                        </div>
                        <p className="text-xs text-muted mt-1">{entry.description}</p>
                        {entry.output.length > 0 && (
                          <div className="mt-2 rounded bg-slate-50 p-2 border border-border/50">
                            {entry.output.map((line, i) => (
                              <p key={i} className="text-[11px] font-mono text-muted leading-5">
                                {line}
                              </p>
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

          {/* SQL Tab */}
          {activeTab === "sql" && (
            <div className="rounded-lg border border-border overflow-hidden">
              <div className="bg-surface px-4 py-2.5 flex items-center gap-2">
                <FileText className="h-4 w-4 text-info" />
                <span className="text-xs font-medium text-ink">Executed SQL</span>
              </div>
              <div className="bg-slate-950 p-4 overflow-x-auto">
                <pre className="text-xs leading-5 text-slate-200 whitespace-pre-wrap">{result.sql}</pre>
              </div>
            </div>
          )}

          {/* Sources Tab */}
          {activeTab === "sources" && result.commands && (
            <div className="space-y-3">
              <Card>
                <h3 className="font-semibold text-ink flex items-center gap-2 mb-2">
                  <Database className="h-4 w-4 text-info" />
                  Coral Sources Queried
                </h3>
                <p className="text-xs text-muted mb-3">{result.commands.length} commands executed</p>
                <div className="flex flex-wrap gap-2">
                  {[
                    "careops_patients",
                    "careops_medications",
                    "careops_lab_reports",
                    "careops_doctor_chats",
                    "careops_pharmacy_receipts",
                    "careops_symptom_logs",
                    "careops_appointments",
                    "careops_prescription_ocr",
                    "careops_family_notes",
                  ].map((s) => (
                    <Badge key={s} tone="success">
                      {s}
                    </Badge>
                  ))}
                </div>
              </Card>
              {result.datasetStats && (
                <Card>
                  <h3 className="font-semibold text-ink flex items-center gap-2 mb-2">
                    <Table2 className="h-4 w-4 text-info" />
                    Dataset Statistics
                  </h3>
                  <div className="grid grid-cols-3 gap-2">
                    {Object.entries(result.datasetStats.totalRows || {}).map(([key, val]) => (
                      <div key={key} className="text-xs">
                        <span className="text-muted">{key}: </span>
                        <span className="font-medium text-ink">{String(val)}</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-muted mt-2">
                    Total records: {result.datasetStats.total || 0}
                  </p>
                </Card>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ActivityIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  );
}

function HelpIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}
