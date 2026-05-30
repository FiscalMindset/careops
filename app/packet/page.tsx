"use client";

import { useState, useCallback } from "react";
import { Badge, Card, ExportButton, PageHeader, SafetyNotice } from "@/components/ui";
import {
  Loader2, Search, Terminal, CheckCircle, AlertCircle, ChevronRight,
  FileText, Database, Table2, Timer, Play, Clock, HelpCircle, Lightbulb,
  AlertTriangle, ArrowUp, BookOpen, Pill, Beaker, MessageSquare, Activity,
  Zap
} from "lucide-react";

type QueryMode = "coral_cli" | "mock" | "sqlite";

const MODE_CONFIG: Record<QueryMode, { label: string; tone: "success" | "warning" | "neutral"; desc: string }> = {
  coral_cli: { label: "Real Coral CLI", tone: "success", desc: "Queries via real coral sql against registered sources" },
  mock: { label: "Mock / Test Data", tone: "warning", desc: "Simulated queries using in-memory data — no Coral CLI needed" },
  sqlite: { label: "SQLite Fallback", tone: "neutral", desc: "Queries against local SQLite database" },
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

const PATIENTS = [
  { id: "pat-001", name: "Raman Mehta", condition: "Diabetes follow-up" },
  { id: "pat-002", name: "Leela Shah", condition: "Hypertension review" },
  { id: "pat-003", name: "Dev Kapoor", condition: "Post-discharge medication reconciliation" },
];

function JsonTable({ data, maxRows = 20 }: { data: Record<string, any>[]; maxRows?: number }) {
  if (!data || data.length === 0) return <p className="p-3 text-xs italic text-muted">No data</p>;
  const cols = Object.keys(data[0]);
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-border bg-surface">
            {cols.map(col => <th key={col} className="px-3 py-2 text-left font-medium text-muted">{col}</th>)}
          </tr>
        </thead>
        <tbody>
          {data.slice(0, maxRows).map((row, i) => (
            <tr key={i} className="border-b border-border/50 last:border-0 hover:bg-surface/50">
              {cols.map(col => <td key={col} className="px-3 py-2 text-muted">{row[col] ?? "—"}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
      {data.length > maxRows && <p className="border-t border-border p-3 text-xs text-muted">Showing first {maxRows} of {data.length} rows</p>}
    </div>
  );
}

function parseJsonRows(raw: string): Record<string, any>[] {
  try {
    const parsed = JSON.parse(raw.trim());
    return Array.isArray(parsed) ? parsed : [];
  } catch { return []; }
}

function tryAsTable(raw: string) {
  const rows = parseJsonRows(raw);
  if (rows.length > 0) return <JsonTable data={rows} />;
  return <pre className="max-h-60 overflow-x-auto p-3 font-mono text-[11px] leading-5 text-muted">{raw}</pre>;
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
  if (isOutOfRange) return <span className="font-semibold text-danger">{value} {unit} <Zap className="inline h-3 w-3" /></span>;
  return <span className="text-muted">{value} {unit}</span>;
}

function MedicineBadge({ medicine }: { medicine: any }) {
  if (medicine.end_date) return <Badge tone="warning">Discontinued {medicine.end_date}</Badge>;
  return <Badge tone="success">Active</Badge>;
}

function InstructionBadge({ type }: { type: string }) {
  if (type === "dose_change") return <Badge tone="warning">Dose change</Badge>;
  if (type === "lab_ordered") return <Badge tone="info">Lab ordered</Badge>;
  if (type === "follow_up") return <Badge tone="success">Follow-up</Badge>;
  return <Badge tone="neutral">{type}</Badge>;
}

function TutorialBanner({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(0);
  const steps = [
    { icon: <Play className="h-5 w-5" />, title: "1. Select a patient", desc: "Pick a patient and visit purpose, then click Generate. CareOps runs 10+ queries across 9 Coral data sources." },
    { icon: <Timer className="h-5 w-5" />, title: "2. Review the summary", desc: "The one-page packet shows medicines with active/discontinued badges, labs with out-of-range alerts, and symptom severity indicators." },
    { icon: <AlertTriangle className="h-5 w-5" />, title: "3. Check missing records", desc: "CareOps detects gaps in your records — missing labs, unfilled refills, or unlogged vitals — highlighted in amber." },
    { icon: <HelpCircle className="h-5 w-5" />, title: "4. Take questions to your doctor", desc: "Each packet includes prepared questions to discuss with your healthcare provider at the next visit." },
  ];
  return (
    <Card className="border-blue-200 bg-blue-50/50">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-info" />
          <h3 className="font-semibold text-ink">How to use the packet builder</h3>
        </div>
        <button onClick={onClose} className="text-xs text-muted hover:text-ink">✕ Dismiss</button>
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-4">
        {steps.map((s, i) => (
          <button key={i} onClick={() => setStep(i)}
            className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-2 text-left text-xs font-medium transition-colors ${
              step === i ? "border-info bg-white text-ink" : "border-transparent bg-white/60 text-muted hover:bg-white"
            }`}
          >
            <span className={`shrink-0 ${step === i ? "text-info" : "text-muted"}`}>{s.icon}</span>
            <span>{s.title}</span>
          </button>
        ))}
      </div>
      <div className="mt-3 rounded bg-white p-3 text-sm leading-6 text-muted">
        {steps[step].desc}
      </div>
    </Card>
  );
}

function sectionHasOutOfRangeLabs(labs: any[]) {
  return labs.some((l: any) => {
    if (!l.reference_range) return false;
    const match = l.reference_range.match(/(\d+\.?\d*)\s*[-–]\s*(\d+\.?\d*)/);
    if (!match) return false;
    const num = parseFloat(l.value);
    return !isNaN(num) && (num < parseFloat(match[1]) || num > parseFloat(match[2]));
  });
}

function sectionHasHighSeverity(symptoms: any[]) {
  return symptoms.some((s: any) => s.severity >= 7);
}

function sectionHasModerateSeverity(symptoms: any[]) {
  return symptoms.some((s: any) => s.severity >= 4 && s.severity < 7);
}

export default function PacketPage() {
  const [mode, setMode] = useState<QueryMode>("coral_cli");
  const [showTutorial, setShowTutorial] = useState(true);

  const [selectedPatient, setSelectedPatient] = useState("pat-001");
  const [visitPurpose, setVisitPurpose] = useState("diabetes follow-up");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PacketResponse | null>(null);
  const [error, setError] = useState("");
  const [showSql, setShowSql] = useState(true);
  const [showRaw, setShowRaw] = useState(false);
  const [showRows, setShowRows] = useState(true);

  const patient = PATIENTS.find(p => p.id === selectedPatient);

  const handleGenerate = useCallback(async () => {
    setLoading(true); setError(""); setResult(null);
    try {
      const modeParam = mode !== "coral_cli" ? `&mode=${mode}` : "";
      const res = await fetch(`/api/care-packet?patientId=${selectedPatient}&purpose=${encodeURIComponent(visitPurpose)}${modeParam}`);
      if (!res.ok) throw new Error("Packet generation failed");
      const data: PacketResponse = await res.json();
      if (data.error) throw new Error(data.error);
      setResult(data);
    } catch (err: any) {
      setError(err.message || "Failed to generate packet");
    } finally { setLoading(false); }
  }, [mode, selectedPatient, visitPurpose]);

  return (
    <div className="space-y-6">
      <PageHeader title="Doctor Visit Packet Builder" eyebrow={MODE_CONFIG[mode].label}>
        Generate a doctor-ready packet from {mode === "coral_cli" ? "real coral sql queries" : "mock/test data"} across 9 CareOps sources.
      </PageHeader>

      {/* Mode Toggle */}
      <Card>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Terminal className="h-5 w-5 text-info" />
            <span className="text-sm font-medium text-ink">Query mode:</span>
          </div>
          <div className="flex overflow-hidden rounded-lg border border-border">
            {(Object.entries(MODE_CONFIG) as [QueryMode, typeof MODE_CONFIG['coral_cli']][]).map(([key, cfg]) => {
              const activeMap: Record<string, string> = {
                coral_cli: 'bg-green-50 text-green-700 border-b-2 border-green-500',
                mock: 'bg-amber-50 text-amber-700 border-b-2 border-amber-500',
                sqlite: 'bg-slate-50 text-slate-700 border-b-2 border-slate-500',
              };
              return (
              <button key={key} onClick={() => setMode(key)}
                className={`px-3 py-2 text-xs font-medium transition-colors ${
                  mode === key ? activeMap[key] : 'bg-white text-muted hover:bg-surface'
                }`}
              >
                {cfg.label}
              </button>
              );
            })}
          </div>
          <Badge tone={MODE_CONFIG[mode].tone}>{MODE_CONFIG[mode].label}</Badge>
        </div>
      </Card>

      <SafetyNotice />

      {showTutorial && <TutorialBanner onClose={() => setShowTutorial(false)} />}

      {/* Controls */}
      <Card>
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink">Patient</label>
            <select value={selectedPatient} onChange={e => { setSelectedPatient(e.target.value); const p = PATIENTS.find(x => x.id === e.target.value); if (p) setVisitPurpose(p.condition); }}
              className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm text-ink focus:border-info focus:outline-none focus:ring-1 focus:ring-info"
            >
              {PATIENTS.map(p => <option key={p.id} value={p.id}>{p.name} ({p.id})</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink">Visit purpose</label>
            <input type="text" value={visitPurpose} onChange={e => setVisitPurpose(e.target.value)}
              placeholder="e.g. diabetes follow-up"
              className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm text-ink placeholder:text-muted focus:border-info focus:outline-none focus:ring-1 focus:ring-info"
            />
          </div>
          <div className="flex items-end">
            <button onClick={handleGenerate} disabled={loading || !visitPurpose.trim()}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-ink px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50 transition-colors"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              {loading ? "Generating..." : "Generate Packet"}
            </button>
          </div>
        </div>
      </Card>

      {/* Quick actions */}
      <div className="flex flex-wrap gap-2">
        {PATIENTS.map(p => (
          <button key={p.id} onClick={() => { setSelectedPatient(p.id); setVisitPurpose(p.condition); }} disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface px-3 py-1.5 text-xs text-muted hover:border-info hover:text-info disabled:opacity-50 transition-colors"
          >
            <Play className="h-3 w-3" /> {p.name} — {p.condition}
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

      {loading && (
        <Card>
          <div className="flex items-center gap-3">
            <Loader2 className="h-5 w-5 animate-spin text-info" />
            <div>
              <p className="text-sm font-medium text-ink">Running {mode === "coral_cli" ? "coral sql" : "mock"} queries...</p>
              <p className="text-xs text-muted">Executing queries across 9 CareOps data sources</p>
            </div>
          </div>
        </Card>
      )}

      {/* Packet Result */}
      {result?.packet && (
        <div className="space-y-4">
          {/* Stats bar */}
          <div className="flex flex-wrap gap-3">
            <Card className="min-w-[200px] flex-1">
              <div className="flex items-center gap-2 text-sm font-medium text-ink"><Database className="h-4 w-4 text-info" /> Sources</div>
              <p className="mt-1 text-xs text-muted">{result.sourcesUsed.length} Coral sources</p>
            </Card>
            <Card className="min-w-[200px] flex-1">
              <div className="flex items-center gap-2 text-sm font-medium text-ink"><Table2 className="h-4 w-4 text-info" /> Joined rows</div>
              <p className="mt-1 text-xs text-muted">{result.rowCount} rows</p>
            </Card>
            <Card className="min-w-[200px] flex-1">
              <div className="flex items-center gap-2 text-sm font-medium text-ink"><Timer className="h-4 w-4 text-info" /> Commands</div>
              <p className="mt-1 text-xs text-muted">{result.commands.length} queries</p>
            </Card>
          </div>

          {/* Mode + Export */}
          <Card>
            <div className="flex flex-wrap items-center gap-3">
              <ExportButton />
              <Badge tone={MODE_CONFIG[mode as QueryMode]?.tone || "success"}>{MODE_CONFIG[mode as QueryMode]?.label || mode}</Badge>
              <span className="text-xs text-muted">Generated via {mode === "coral_cli" ? "real coral sql" : "mock queries"}</span>
            </div>
          </Card>

          {/* Patient */}
          {result.packet.patient && (
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
              <div className="flex items-center gap-2">
                <Badge tone="info">Patient</Badge>
                <span className="font-semibold text-ink">{result.packet.patient.name}</span>
              </div>
              <p className="mt-1 text-xs text-muted">
                {result.packet.patient.age}y · {result.packet.patient.gender} · {result.packet.patient.condition_focus} · {result.packet.patient.primary_doctor}
              </p>
            </div>
          )}

          {/* Summary */}
          <Card>
            <h3 className="text-xl font-semibold">One-page doctor-ready packet</h3>
            <p className="mt-2 text-sm leading-6 text-muted">{result.packet.summary}</p>
          </Card>

          {/* Highlighted sections */}
          <div className="grid gap-4 lg:grid-cols-2">
            {/* Current Medicines */}
            <Card>
              <h3 className="flex items-center gap-1.5 font-semibold">
                <Pill className="h-4 w-4 text-info" /> Current medicines
                {result.packet.currentMedicines.filter((m: any) => m.end_date).length > 0 && (
                  <Badge tone="warning">{result.packet.currentMedicines.filter((m: any) => m.end_date).length} discontinued</Badge>
                )}
              </h3>
              <ul className="mt-3 space-y-2 text-sm">
                {result.packet.currentMedicines.length === 0 && <li className="italic text-muted">No current medicines</li>}
                {result.packet.currentMedicines.map((m: any) => (
                  <li key={m.medicine_name} className="flex flex-wrap items-center gap-1.5">
                    <span className="font-medium text-ink">{m.medicine_name}</span>
                    <span className="text-muted">{m.dose}, {m.frequency}</span>
                    <MedicineBadge medicine={m} />
                  </li>
                ))}
              </ul>
            </Card>

            {/* Recent Labs */}
            <Card>
              <h3 className="flex items-center gap-1.5 font-semibold">
                <Beaker className="h-4 w-4 text-info" /> Recent labs
                {sectionHasOutOfRangeLabs(result.packet.recentLabs) && <Badge tone="danger">Out of range</Badge>}
              </h3>
              <ul className="mt-3 space-y-2 text-sm">
                {result.packet.recentLabs.length === 0 && <li className="italic text-muted">No recent labs</li>}
                {result.packet.recentLabs.map((l: any) => (
                  <li key={`${l.test_name}-${l.report_date}`} className="flex flex-wrap items-center gap-1.5">
                    <span className="text-muted">{l.report_date}:</span>
                    <span className="font-medium text-ink">{l.test_name}</span>
                    <LabValueBadge value={l.value} unit={l.unit} referenceRange={l.reference_range} />
                    {l.reference_range && <span className="text-muted">(ref: {l.reference_range})</span>}
                  </li>
                ))}
              </ul>
            </Card>

            {/* Doctor Instructions */}
            <Card>
              <h3 className="flex items-center gap-1.5 font-semibold">
                <MessageSquare className="h-4 w-4 text-info" /> Doctor instructions
                {result.packet.doctorInstructions.filter((d: any) => d.instruction_type === "dose_change").length > 0 && (
                  <Badge tone="warning">Dose changes</Badge>
                )}
              </h3>
              <ul className="mt-3 space-y-2 text-sm">
                {result.packet.doctorInstructions.length === 0 && <li className="italic text-muted">No instructions</li>}
                {result.packet.doctorInstructions.map((d: any) => (
                  <li key={`${d.date}-${d.instruction_type}`} className="flex flex-wrap items-start gap-1.5">
                    <span className="text-muted">{d.date}:</span>
                    <InstructionBadge type={d.instruction_type} />
                    <span className="text-muted">{d.message}</span>
                    {d.medicine_mentioned && <Badge tone="neutral">{d.medicine_mentioned}</Badge>}
                  </li>
                ))}
              </ul>
            </Card>

            {/* Refill Evidence */}
            <Card>
              <h3 className="flex items-center gap-1.5 font-semibold">Refill status</h3>
              <ul className="mt-3 space-y-2 text-sm">
                {result.packet.refillEvidence.length === 0 && <li className="italic text-muted">No refill records</li>}
                {result.packet.refillEvidence.map((r: any) => (
                  <li key={`${r.medicine}-${r.date}`} className="flex flex-wrap items-center gap-1.5">
                    <span className="text-muted">{r.date}:</span>
                    <span className="font-medium text-ink">{r.medicine}</span>
                    <span className="text-muted">{r.quantity} @ {r.pharmacy}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </div>

          {/* Symptom Timeline */}
          {result.packet.symptomTimeline.length > 0 && (
            <Card>
              <h3 className="flex items-center gap-1.5 font-semibold">
                <Activity className="h-4 w-4 text-info" /> Symptom timeline
                {sectionHasHighSeverity(result.packet.symptomTimeline) && <Badge tone="danger">High severity</Badge>}
                {sectionHasModerateSeverity(result.packet.symptomTimeline) && <Badge tone="warning">Moderate</Badge>}
              </h3>
              <ul className="mt-3 space-y-2 text-sm">
                {result.packet.symptomTimeline.map((s: any) => (
                  <li key={`${s.date}-${s.symptom}`} className="flex flex-wrap items-center gap-1.5">
                    <span className="text-muted">{s.date}:</span>
                    <span className="font-medium text-ink">{s.symptom}</span>
                    <SeverityBadge severity={s.severity} />
                    {s.related_medicine && <Badge tone="neutral">Related: {s.related_medicine}</Badge>}
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {/* Appointments */}
          {result.packet.appointments.length > 0 && (
            <Card>
              <h3 className="font-semibold">Appointments</h3>
              <ul className="mt-3 space-y-2 text-sm">
                {result.packet.appointments.map((a: any) => (
                  <li key={`${a.appointment_date}-${a.doctor}`} className="flex flex-wrap items-center gap-1.5">
                    <span className="text-muted">{a.appointment_date}:</span>
                    <span className="font-medium text-ink">{a.doctor}</span>
                    <Badge tone="neutral">{a.speciality}</Badge>
                    <span className="text-muted">— {a.reason}</span>
                    <Badge tone={a.status === "scheduled" ? "info" : "success"}>{a.status}</Badge>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {/* Missing Records */}
          {result.packet.missingRecords.length > 0 && (
            <Card className="border-amber-200 bg-amber-50">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-warning" />
                <h3 className="font-semibold text-amber-800">Missing records</h3>
              </div>
              <ul className="mt-2 space-y-1 text-sm text-amber-700">
                {result.packet.missingRecords.map((m, i) => (
                  <li key={i} className="flex items-start gap-1.5"><ArrowUp className="mt-0.5 h-4 w-4 shrink-0 text-warning" />{m}</li>
                ))}
              </ul>
            </Card>
          )}

          {/* Questions */}
          <Card>
            <h3 className="flex items-center gap-1.5 font-semibold">
              <HelpCircle className="h-4 w-4 text-info" /> Questions to ask doctor
            </h3>
            <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-6">
              {result.packet.questionsForDoctor.map((q, i) => (
                <li key={i}>{q}</li>
              ))}
            </ol>
          </Card>

          {/* SQL */}
          <div className="overflow-hidden rounded-lg border border-border">
            <button onClick={() => setShowSql(!showSql)}
              className="flex w-full items-center justify-between bg-surface px-4 py-3 text-sm font-medium text-ink hover:bg-slate-100 transition-colors"
            >
              <span className="flex items-center gap-2"><FileText className="h-4 w-4 text-info" /> Executed SQL Query</span>
              <ChevronRight className={`h-4 w-4 transition-transform ${showSql ? "rotate-90" : ""}`} />
            </button>
            {showSql && <div className="bg-slate-950 p-4"><pre className="overflow-x-auto text-xs leading-5 text-slate-200">{result.sql}</pre></div>}
          </div>

          {/* Raw Coral Output as Table */}
          <div className="overflow-hidden rounded-lg border border-border">
            <button onClick={() => setShowRaw(!showRaw)}
              className="flex w-full items-center justify-between bg-surface px-4 py-3 text-sm font-medium text-ink hover:bg-slate-100 transition-colors"
            >
              <span className="flex items-center gap-2"><Terminal className="h-4 w-4 text-info" /> Raw Coral Output ({result.commands.length} sections)</span>
              <ChevronRight className={`h-4 w-4 transition-transform ${showRaw ? "rotate-90" : ""}`} />
            </button>
            {showRaw && (
              <div className="space-y-1 p-3">
                {result.rawCoralOutput.split("--- ").filter(Boolean).map((section, i) => {
                  const [header, ...bodyLines] = section.split("\n");
                  const body = bodyLines.join("\n").trim();
                  if (!body) return null;
                  return (
                    <details key={i} className="rounded border border-border">
                      <summary className="flex cursor-pointer items-center gap-2 px-2 py-1.5 text-[10px] font-medium text-ink hover:bg-surface/50">
                        <Terminal className="h-3 w-3" /> {header.replace(" ---", "")}
                      </summary>
                      <div className="border-t border-border">{tryAsTable(body)}</div>
                    </details>
                  );
                })}
              </div>
            )}
          </div>

          {/* Sources */}
          <div className="overflow-hidden rounded-lg border border-border">
            <button onClick={() => setShowSql(!showSql)}
              className="flex w-full items-center justify-between bg-surface px-4 py-3 text-sm font-medium text-ink hover:bg-slate-100"
            >
              <span className="flex items-center gap-2"><Database className="h-4 w-4 text-info" /> Coral Sources ({result.sourcesUsed.length})</span>
              <ChevronRight className={`h-4 w-4 transition-transform ${showSql ? "rotate-90" : ""}`} />
            </button>
            <div className="flex flex-wrap gap-2 border-t border-border p-4">
              {result.sourcesUsed.map(s => <Badge key={s} tone="success">{s}</Badge>)}
            </div>
          </div>

          {/* Joined Results Table */}
          {result.joinedRows.length > 0 && (
            <div className="overflow-hidden rounded-lg border border-border">
              <button onClick={() => setShowRows(!showRows)}
                className="flex w-full items-center justify-between bg-surface px-4 py-3 text-sm font-medium text-ink hover:bg-slate-100 transition-colors"
              >
                <span className="flex items-center gap-2"><Table2 className="h-4 w-4 text-info" /> Joined Results ({result.rowCount} rows)</span>
                <ChevronRight className={`h-4 w-4 transition-transform ${showRows ? "rotate-90" : ""}`} />
              </button>
              {showRows && <div className="border-t border-border"><JsonTable data={result.joinedRows} /></div>}
            </div>
          )}

          <p className="flex items-center gap-1 text-[10px] text-muted">
            <Clock className="h-3 w-3" /> Generated at {new Date(result.timestamp).toLocaleString()} via {result.mode}
          </p>

          <p className="flex items-center gap-1 text-xs text-muted">
            <Lightbulb className="h-3 w-3 text-warning" /> CareOps does not diagnose, prescribe, or recommend medicine changes.
          </p>

          <SafetyNotice />
        </div>
      )}
    </div>
  );
}
