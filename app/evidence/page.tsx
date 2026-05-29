"use client";

import { useState, useCallback } from "react";
import { Badge, Card, PageHeader } from "@/components/ui";
import { 
  Loader2, CheckCircle, XCircle, Terminal, Database, FileText, Table2, 
  Play, RefreshCw, AlertCircle, Clock, ChevronDown, ChevronRight, 
  HelpCircle, Lightbulb, AlertTriangle, ArrowUp, Zap, BookOpen,
  Pill, Beaker, MessageSquare, Activity
} from "lucide-react";

type QueryMode = "coral_cli" | "mock" | "sqlite";

const MODE_CONFIG: Record<QueryMode, { label: string; tone: "success" | "warning" | "neutral"; desc: string }> = {
  coral_cli: { label: "Real Coral CLI", tone: "success", desc: "All commands run via real coral sql against registered sources" },
  mock: { label: "Mock / Test Data", tone: "warning", desc: "Simulated queries using in-memory data — no Coral CLI needed" },
  sqlite: { label: "SQLite Fallback", tone: "neutral", desc: "Queries against local SQLite database (run npm run seed)" },
};

type SourceListResponse = {
  mode: string; command: string; rawOutput: string;
  sources: { name: string; version: string; origin: string }[];
  sourceCount: number; careOpsSources: { name: string; version: string; origin: string }[];
  careOpsCount: number; timestamp: string; error?: string;
};

type RunQueryResponse = {
  mode: string; patientId: string; visitPurpose: string;
  commands: string[]; sourcesUsed: string[]; sql: string;
  rawCoralOutput: string; executionTimeMs: number;
  joinedRows: Record<string, any>[]; rowCount: number;
  error: string | null; timestamp: string;
};

type PacketResponse = {
  mode: string; patientId: string; visitPurpose: string;
  commands: string[]; sourcesUsed: string[]; sql: string;
  rawCoralOutput: string; joinedRows: Record<string, any>[];
  rowCount: number; errors: string[]; timestamp: string; error?: string;
  packet: {
    summary: string; patient: any; currentMedicines: any[];
    recentLabs: any[]; symptomTimeline: any[]; doctorInstructions: any[];
    refillEvidence: any[]; appointments: any[]; familyNotes: any[];
    missingRecords: string[]; questionsForDoctor: string[]; safetyNotice: string;
  } | null;
};

type ActionStatus = "idle" | "running" | "success" | "error";

function JsonTable({ data, maxRows = 20 }: { data: Record<string, any>[]; maxRows?: number }) {
  if (!data || data.length === 0) return <p className="p-3 text-xs text-muted italic">No data</p>;
  const cols = Object.keys(data[0]);
  return (
    <div className="overflow-x-auto border-t border-border">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-border bg-surface">
            {cols.map(col => <th key={col} className="px-3 py-2 text-left font-medium text-muted">{col}</th>)}
          </tr>
        </thead>
        <tbody>
          {data.slice(0, maxRows).map((row, i) => (
            <tr key={i} className="border-b border-border/50 last:border-0 hover:bg-surface/50">
              {cols.map(col => (
                <td key={col} className="px-3 py-2 text-muted">{row[col] ?? "—"}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {data.length > maxRows && (
        <p className="border-t border-border p-3 text-xs text-muted">Showing first {maxRows} of {data.length} rows</p>
      )}
    </div>
  );
}

function parseJsonRows(raw: string): Record<string, any>[] {
  try {
    const parsed = JSON.parse(raw.trim());
    if (Array.isArray(parsed)) return parsed;
    if (typeof parsed === "object" && parsed !== null) return [parsed];
    return [];
  } catch { return []; }
}

function tryAsTable(raw: string, label: string) {
  const rows = parseJsonRows(raw);
  if (rows.length > 0) {
    return <JsonTable data={rows} />;
  }
  return <pre className="max-h-60 overflow-x-auto px-3 pb-3 pt-1 font-mono text-[11px] leading-5 text-muted">{raw}</pre>;
}

function SeverityBadge({ severity }: { severity: number }) {
  if (severity >= 7) return <Badge tone="danger">Severity: {severity}/10</Badge>;
  if (severity >= 4) return <Badge tone="warning">Severity: {severity}/10</Badge>;
  return <Badge tone="info">Severity: {severity}/10</Badge>;
}

function LabValueBadge({ value, unit, referenceRange }: { value: string; unit: string; referenceRange?: string }) {
  const num = parseFloat(value);
  if (isNaN(num)) return <span className="text-muted">{value} {unit}</span>;
  let isOutOfRange = false;
  if (referenceRange) {
    const match = referenceRange.match(/(\d+\.?\d*)\s*[-–]\s*(\d+\.?\d*)/);
    if (match) { const lo = parseFloat(match[1]), hi = parseFloat(match[2]); isOutOfRange = num < lo || num > hi; }
  }
  if (isOutOfRange) return <span className="font-semibold text-danger">{value} {unit} ⚠</span>;
  return <span className="text-muted">{value} {unit}</span>;
}

function InstructionBadge({ type }: { type: string }) {
  if (type === "dose_change") return <Badge tone="warning">Dose change</Badge>;
  if (type === "lab_ordered") return <Badge tone="info">Lab ordered</Badge>;
  if (type === "follow_up") return <Badge tone="success">Follow-up</Badge>;
  return <Badge tone="neutral">{type}</Badge>;
}

function MedicineChangeBadge({ medicine }: { medicine: any }) {
  if (medicine.end_date) return <Badge tone="warning">Discontinued {medicine.end_date}</Badge>;
  return <Badge tone="success">Active</Badge>;
}

function TutorialSection({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(0);
  const steps = [
    { icon: <Database className="h-5 w-5" />, title: "Choose a mode", desc: "Toggle between Real Coral CLI (requires Coral installed) or Mock/Test data to see how the app works without live sources." },
    { icon: <Play className="h-5 w-5" />, title: "Run an action", desc: "Click any button below to execute a real coral sql command or a mock equivalent. Watch the Coral CLI in action." },
    { icon: <Table2 className="h-5 w-5" />, title: "Explore results", desc: "Raw Coral output is formatted as tables. Open the sections to inspect queries, sources, and joined rows." },
    { icon: <RefreshCw className="h-5 w-5" />, title: "Generate a packet", desc: "The last button runs the full packet pipeline — 10+ queries across 9 sources. Results are highlighted to show what matters." },
  ];
  return (
    <Card className="border-blue-200 bg-blue-50/50">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-info" />
          <h3 className="font-semibold text-ink">Quick tour</h3>
        </div>
        <button onClick={onClose} className="text-xs text-muted hover:text-ink">✕ Dismiss</button>
      </div>
      <div className="mt-3 flex items-center gap-3">
        {steps.map((s, i) => (
          <button key={i} onClick={() => setStep(i)}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              step === i ? "bg-info text-white" : "bg-white text-muted hover:bg-blue-100"
            }`}
          >
            {s.icon}{s.title}
          </button>
        ))}
      </div>
      <div className="mt-3 rounded bg-white p-3 text-sm leading-6 text-muted">
        <strong className="text-ink">{steps[step].title}:</strong> {steps[step].desc}
      </div>
    </Card>
  );
}

function ModeToggle({ mode, onChange }: { mode: QueryMode; onChange: (m: QueryMode) => void }) {
  return (
    <Card>
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <Terminal className="h-5 w-5 text-info" />
          <span className="text-sm font-medium text-ink">Query mode:</span>
        </div>
        <div className="flex rounded-lg border border-border overflow-hidden">
          {(Object.entries(MODE_CONFIG) as [QueryMode, typeof MODE_CONFIG['coral_cli']][]).map(([key, cfg]) => (
            <button key={key} onClick={() => onChange(key)}
              className={`px-3 py-2 text-xs font-medium transition-colors ${
                mode === key
                  ? `bg-${cfg.tone === 'success' ? 'green' : cfg.tone === 'warning' ? 'amber' : 'slate'}-50 text-${cfg.tone === 'success' ? 'green' : cfg.tone === 'warning' ? 'amber' : 'slate'}-800 border-b-2 border-${cfg.tone === 'success' ? 'green' : cfg.tone === 'warning' ? 'amber' : 'slate'}-500`
                  : 'bg-white text-muted hover:bg-surface'
              }`}
            >
              {cfg.label}
            </button>
          ))}
        </div>
        <Badge tone={MODE_CONFIG[mode].tone}>{MODE_CONFIG[mode].label}</Badge>
        <span className="text-xs text-muted">{MODE_CONFIG[mode].desc}</span>
      </div>
    </Card>
  );
}

export default function EvidencePage() {
  const [mode, setMode] = useState<QueryMode>("coral_cli");
  const [showTutorial, setShowTutorial] = useState(true);

  const [sourceStatus, setSourceStatus] = useState<ActionStatus>("idle");
  const [queryStatus, setQueryStatus] = useState<ActionStatus>("idle");
  const [packetStatus, setPacketStatus] = useState<ActionStatus>("idle");

  const [sourceResult, setSourceResult] = useState<SourceListResponse | null>(null);
  const [queryResult, setQueryResult] = useState<RunQueryResponse | null>(null);
  const [packetResult, setPacketResult] = useState<PacketResponse | null>(null);
  const [error, setError] = useState("");
  const [timestamp, setTimestamp] = useState("");

  const modeSuffix = mode !== "coral_cli" ? `&mode=${mode}` : "";

  const verifySources = useCallback(async () => {
    setSourceStatus("running"); setError("");
    try {
      const res = await fetch(`/api/coral/source-list${mode !== "coral_cli" ? `?mode=${mode}` : ""}`);
      const data: SourceListResponse = await res.json();
      setSourceResult(data); setTimestamp(data.timestamp);
      setSourceStatus(data.error ? "error" : "success");
      if (data.error) setError(data.error);
    } catch (err: any) { setSourceStatus("error"); setError(err.message); }
  }, [mode]);

  const runQuery = useCallback(async () => {
    setQueryStatus("running"); setError("");
    try {
      const res = await fetch(`/api/coral/run-query?patientId=pat-001&purpose=diabetes%20follow-up${modeSuffix}`);
      const data: RunQueryResponse = await res.json();
      setQueryResult(data); setTimestamp(data.timestamp);
      setQueryStatus(data.error ? "error" : "success");
      if (data.error) setError(data.error);
    } catch (err: any) { setQueryStatus("error"); setError(err.message); }
  }, [modeSuffix]);

  const generatePacket = useCallback(async () => {
    setPacketStatus("running"); setError("");
    try {
      const res = await fetch(`/api/care-packet?patientId=pat-001&purpose=diabetes%20follow-up${modeSuffix}`);
      const data: PacketResponse = await res.json();
      setPacketResult(data); setTimestamp(data.timestamp);
      setPacketStatus(data.error ? "error" : "success");
      if (data.error) setError(data.error);
    } catch (err: any) { setPacketStatus("error"); setError(err.message); }
  }, [modeSuffix]);

  return (
    <div className="space-y-6">
      <PageHeader title="Coral SQL Evidence" eyebrow={`${MODE_CONFIG[mode].label} execution`}>
        Run real or mock Coral SQL queries against 9 CareOps data sources. Toggle modes to test without Coral CLI.
      </PageHeader>

      <ModeToggle mode={mode} onChange={setMode} />

      {showTutorial && <TutorialSection onClose={() => setShowTutorial(false)} />}

      {/* Action buttons */}
      <div className="grid gap-3 md:grid-cols-3">
        {[
          { label: "Verify Coral Sources", desc: "Run coral source list", status: sourceStatus, onClick: verifySources, icon: Database, color: "blue" },
          { label: "Run Live Coral Query", desc: "Execute cross-source JOIN", status: queryStatus, onClick: runQuery, icon: FileText, color: "green" },
          { label: "Generate Packet from Coral", desc: "Full packet via coral sql", status: packetStatus, onClick: generatePacket, icon: RefreshCw, color: "purple" },
        ].map(({ label, desc, status, onClick, icon: Icon, color }) => (
          <button key={label} onClick={onClick} disabled={status === "running"}
            className="group flex items-center gap-3 rounded-lg border border-border bg-white p-4 text-left hover:border-info hover:bg-blue-50/30 disabled:opacity-50 transition-colors"
          >
            <div className={`flex h-10 w-10 items-center justify-center rounded-full bg-${color}-100`}>
              {status === "running" ? <Loader2 className={`h-5 w-5 animate-spin text-${color === 'purple' ? 'purple-600' : color}`} />
                : status === "success" ? <CheckCircle className="h-5 w-5 text-success" />
                : status === "error" ? <XCircle className="h-5 w-5 text-danger" />
                : <Icon className={`h-5 w-5 text-${color === 'blue' ? 'info' : color === 'green' ? 'success' : 'purple-600'}`} />}
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-ink">{label}</h3>
              <p className="text-xs text-muted">{desc}</p>
            </div>
            <Play className="h-4 w-4 shrink-0 text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
        ))}
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-danger" />
            <p className="text-sm text-danger">{error}</p>
          </div>
        </Card>
      )}

      {/* Source Verification Result */}
      {sourceResult && (
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="flex items-center gap-2 font-semibold text-ink"><Database className="h-4 w-4 text-info" /> Coral Source List</h3>
            <div className="flex items-center gap-2">
              <Badge tone={sourceResult.careOpsCount === 9 ? "success" : "warning"}>{sourceResult.careOpsCount} CareOps sources</Badge>
              <Badge tone={MODE_CONFIG[mode].tone}>{MODE_CONFIG[mode].label}</Badge>
            </div>
          </div>
          <div className="mb-4 grid gap-2 md:grid-cols-3">
            <div className="rounded border border-border p-3 text-center">
              <p className="text-2xl font-bold text-ink">{sourceResult.sourceCount}</p>
              <p className="text-xs text-muted">Total Coral sources</p>
            </div>
            <div className="rounded border border-border p-3 text-center">
              <p className="text-2xl font-bold text-success">{sourceResult.careOpsCount}</p>
              <p className="text-xs text-muted">CareOps registered sources</p>
            </div>
            <div className="rounded border border-border p-3 text-center">
              <p className="text-xs text-muted">{new Date(timestamp).toLocaleTimeString()}</p>
              <p className="text-xs text-muted">Last verified</p>
            </div>
          </div>
          <div className="mb-4 flex flex-wrap gap-2">
            {sourceResult.careOpsSources.map(s => (
              <Badge key={s.name} tone="success">{s.name} v{s.version}</Badge>
            ))}
          </div>
          <details className="rounded border border-border">
            <summary className="flex cursor-pointer items-center gap-2 px-3 py-2 text-xs font-medium text-ink hover:bg-surface/50">
              <Terminal className="h-3 w-3" /> View Raw Command Output
            </summary>
            <pre className="max-h-60 overflow-x-auto px-3 pb-3 pt-1 font-mono text-[11px] leading-5 text-muted">
              $ {sourceResult.command}{"\n"}{sourceResult.rawOutput}
            </pre>
          </details>
        </Card>
      )}

      {/* Query Result */}
      {queryResult && (
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="flex items-center gap-2 font-semibold text-ink"><FileText className="h-4 w-4 text-success" /> Cross-Source Join</h3>
            <div className="flex items-center gap-2">
              <Badge tone={queryResult.rowCount > 0 ? "success" : "warning"}>{queryResult.rowCount} rows</Badge>
              <Badge tone="info">{queryResult.executionTimeMs}ms</Badge>
              <Badge tone={MODE_CONFIG[mode].tone}>{MODE_CONFIG[mode].label}</Badge>
            </div>
          </div>
          <div className="mb-4 flex flex-wrap gap-2">
            {queryResult.sourcesUsed.map(s => <Badge key={s} tone="info">{s}</Badge>)}
          </div>

          <details className="mb-3 rounded border border-border">
            <summary className="flex cursor-pointer items-center gap-2 px-3 py-2 text-xs font-medium text-ink hover:bg-surface/50">
              <Terminal className="h-3 w-3" /> View Executed SQL
            </summary>
            <pre className="max-h-80 overflow-x-auto bg-slate-950 px-3 pb-3 pt-1 font-mono text-[11px] leading-5 text-slate-200">{queryResult.sql}</pre>
          </details>

          <details className="mb-3 rounded border border-border">
            <summary className="flex cursor-pointer items-center gap-2 px-3 py-2 text-xs font-medium text-ink hover:bg-surface/50">
              <Terminal className="h-3 w-3" /> View Raw Coral Output
            </summary>
            {tryAsTable(queryResult.rawCoralOutput, "Raw Output")}
          </details>

          {queryResult.joinedRows.length > 0 && (
            <details className="rounded border border-border">
              <summary className="flex cursor-pointer items-center gap-2 px-3 py-2 text-xs font-medium text-ink hover:bg-surface/50">
                <Table2 className="h-3 w-3" /> Joined Rows ({queryResult.rowCount})
              </summary>
              <JsonTable data={queryResult.joinedRows} />
              <p className="border-t border-border p-2 text-[10px] text-muted flex items-center gap-1">
                <Clock className="h-3 w-3" /> {new Date(timestamp).toLocaleString()}
              </p>
            </details>
          )}
        </Card>
      )}

      {/* Packet Result */}
      {packetResult?.packet && (
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="flex items-center gap-2 font-semibold text-ink">
              <RefreshCw className="h-4 w-4 text-purple-600" /> Packet from Coral
            </h3>
            <div className="flex items-center gap-2">
              <Badge tone="success">Generated from {MODE_CONFIG[mode].label}</Badge>
              <Badge tone={MODE_CONFIG[mode].tone}>{mode}</Badge>
            </div>
          </div>

          <div className="mb-4 flex flex-wrap gap-2">
            {packetResult.sourcesUsed.map(s => <Badge key={s} tone="success">{s}</Badge>)}
          </div>

          <p className="mb-4 text-sm leading-6 text-muted">{packetResult.packet.summary}</p>

          {/* Highlighted Packet Sections */}
          <div className="space-y-3">
            {/* Patient */}
            {packetResult.packet.patient && (
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
                <div className="flex items-center gap-2">
                  <Badge tone="info">Patient</Badge>
                  <span className="font-semibold text-ink">{packetResult.packet.patient.name}</span>
                </div>
                <p className="mt-1 text-xs text-muted">
                  {packetResult.packet.patient.age}y · {packetResult.packet.patient.gender} · {packetResult.packet.patient.condition_focus} · {packetResult.packet.patient.primary_doctor}
                </p>
              </div>
            )}

            {/* Current Medicines */}
            <div className="rounded-lg border border-border p-3">
              <h4 className="flex items-center gap-1.5 text-xs font-semibold text-ink">
                <Pill className="h-3.5 w-3.5 text-info" /> Current Medicines
                {packetResult.packet.currentMedicines.filter((m: any) => m.end_date).length > 0 && (
                  <Badge tone="warning">{packetResult.packet.currentMedicines.filter((m: any) => m.end_date).length} discontinued</Badge>
                )}
              </h4>
              <div className="mt-2 space-y-1.5">
                {packetResult.packet.currentMedicines.length === 0 && <p className="text-xs italic text-muted">None</p>}
                {packetResult.packet.currentMedicines.map((m: any, i: number) => (
                  <div key={i} className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="font-medium text-ink">{m.medicine_name}</span>
                    <span className="text-muted">{m.dose}, {m.frequency}</span>
                    <MedicineChangeBadge medicine={m} />
                    {m.source && <span className="text-muted italic">via {m.source}</span>}
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Labs */}
            <div className="rounded-lg border border-border p-3">
              <h4 className="flex items-center gap-1.5 text-xs font-semibold text-ink">
                <Beaker className="h-3.5 w-3.5 text-info" /> Recent Labs
                {packetResult.packet.recentLabs.some((l: any) => {
                  const ref = l.reference_range;
                  if (!ref) return false;
                  const match = ref.match(/(\d+\.?\d*)\s*[-–]\s*(\d+\.?\d*)/);
                  if (!match) return false;
                  const num = parseFloat(l.value);
                  return !isNaN(num) && (num < parseFloat(match[1]) || num > parseFloat(match[2]));
                }) && <Badge tone="danger">Some values out of range</Badge>}
              </h4>
              <div className="mt-2 space-y-1.5">
                {packetResult.packet.recentLabs.length === 0 && <p className="text-xs italic text-muted">None</p>}
                {packetResult.packet.recentLabs.map((l: any, i: number) => (
                  <div key={i} className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="text-muted">{l.report_date}:</span>
                    <span className="font-medium text-ink">{l.test_name}</span>
                    <LabValueBadge value={l.value} unit={l.unit} referenceRange={l.reference_range} />
                    {l.reference_range && <span className="text-muted">(ref: {l.reference_range})</span>}
                  </div>
                ))}
              </div>
            </div>

            {/* Doctor Instructions */}
            <div className="rounded-lg border border-border p-3">
              <h4 className="flex items-center gap-1.5 text-xs font-semibold text-ink">
                <MessageSquare className="h-3.5 w-3.5 text-info" /> Doctor Instructions
                {packetResult.packet.doctorInstructions.filter((d: any) => d.instruction_type === "dose_change").length > 0 && (
                  <Badge tone="warning">Dose changes</Badge>
                )}
              </h4>
              <div className="mt-2 space-y-1.5">
                {packetResult.packet.doctorInstructions.length === 0 && <p className="text-xs italic text-muted">None</p>}
                {packetResult.packet.doctorInstructions.map((d: any, i: number) => (
                  <div key={i} className="flex flex-wrap items-start gap-2 text-xs">
                    <span className="shrink-0 text-muted">{d.date}:</span>
                    <InstructionBadge type={d.instruction_type} />
                    <span className="text-muted">{d.message}</span>
                    {d.medicine_mentioned && <Badge tone="neutral">Related: {d.medicine_mentioned}</Badge>}
                  </div>
                ))}
              </div>
            </div>

            {/* Symptom Timeline */}
            {packetResult.packet.symptomTimeline.length > 0 && (
              <div className="rounded-lg border border-border p-3">
                <h4 className="flex items-center gap-1.5 text-xs font-semibold text-ink">
                  <Activity className="h-3.5 w-3.5 text-info" /> Symptom Timeline
                  {packetResult.packet.symptomTimeline.some((s: any) => s.severity >= 7) && <Badge tone="danger">High severity</Badge>}
                  {packetResult.packet.symptomTimeline.some((s: any) => s.severity >= 4 && s.severity < 7) && <Badge tone="warning">Moderate severity</Badge>}
                </h4>
                <div className="mt-2 space-y-1.5">
                  {packetResult.packet.symptomTimeline.map((s: any, i: number) => (
                    <div key={i} className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="text-muted">{s.date}:</span>
                      <span className="font-medium text-ink">{s.symptom}</span>
                      <SeverityBadge severity={s.severity} />
                      {s.related_medicine && <Badge tone="neutral">Related: {s.related_medicine}</Badge>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Refill Evidence */}
            <div className="rounded-lg border border-border p-3">
              <h4 className="flex items-center gap-1.5 text-xs font-semibold text-ink">Refill Evidence</h4>
              <div className="mt-2 space-y-1.5 text-xs">
                {packetResult.packet.refillEvidence.length === 0 && <p className="italic text-muted">None</p>}
                {packetResult.packet.refillEvidence.map((r: any, i: number) => (
                  <div key={i} className="flex flex-wrap items-center gap-2">
                    <span className="text-muted">{r.date}:</span>
                    <span className="font-medium text-ink">{r.medicine}</span>
                    <span className="text-muted">{r.quantity} @ {r.pharmacy}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Missing Records */}
          {packetResult.packet.missingRecords.length > 0 && (
            <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-warning" />
                <h4 className="text-xs font-semibold text-amber-800">Missing records</h4>
              </div>
              <ul className="mt-1 space-y-1 text-xs text-amber-700">
                {packetResult.packet.missingRecords.map((m, i) => (
                  <li key={i} className="flex items-start gap-1.5"><ArrowUp className="mt-0.5 h-3 w-3 shrink-0" />{m}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Questions */}
          {packetResult.packet.questionsForDoctor.length > 0 && (
            <div className="mt-4">
              <h4 className="flex items-center gap-1.5 text-xs font-semibold text-ink">
                <HelpCircle className="h-3.5 w-3.5 text-info" /> Questions for doctor
              </h4>
              <ol className="mt-2 list-decimal space-y-1.5 pl-5 text-xs text-muted">
                {packetResult.packet.questionsForDoctor.map((q, i) => (
                  <li key={i} className="leading-5">{q}</li>
                ))}
              </ol>
            </div>
          )}

          {/* Raw Coral Output as Table */}
          {packetResult.rawCoralOutput && (
            <details className="mt-4 rounded border border-border">
              <summary className="flex cursor-pointer items-center gap-2 px-3 py-2 text-xs font-medium text-ink hover:bg-surface/50">
                <Terminal className="h-3 w-3" /> Coral SQL Raw Output
              </summary>
              <div className="space-y-1 p-3">
                {packetResult.rawCoralOutput.split("--- ").filter(Boolean).map((section, i) => {
                  const [header, ...bodyLines] = section.split("\n");
                  const body = bodyLines.join("\n").trim();
                  if (!body) return null;
                  return (
                    <details key={i} className="rounded border border-border">
                      <summary className="flex cursor-pointer items-center gap-2 px-2 py-1.5 text-[10px] font-medium text-ink hover:bg-surface/50">
                        <Terminal className="h-3 w-3" /> {header.replace(" ---", "")}
                      </summary>
                      <div className="border-t border-border">{tryAsTable(body, "")}</div>
                    </details>
                  );
                })}
              </div>
            </details>
          )}

          <p className="mt-4 flex items-center gap-1 border-t border-border pt-3 text-xs text-muted">
            <Lightbulb className="h-3 w-3 text-warning" /> Safety: CareOps does not diagnose, prescribe, or recommend medicine changes.
          </p>
        </Card>
      )}
    </div>
  );
}
