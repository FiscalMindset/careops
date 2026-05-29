"use client";

import { useState } from "react";
import { Badge, Card, ExportButton, PageHeader, SafetyNotice, MissingRecordAlert } from "@/components/ui";
import { Loader2, Search, Terminal, CheckCircle, AlertCircle, ChevronRight, FileText, Database, Table2, Timer, Play, Clock } from "lucide-react";

type PacketResponse = {
  mode: string;
  patientId: string;
  visitPurpose: string;
  commands: string[];
  sourcesUsed: string[];
  sql: string;
  rawCoralOutput: string;
  joinedRows: Record<string, any>[];
  rowCount: number;
  packet: {
    summary: string;
    patient: any;
    currentMedicines: any[];
    recentLabs: any[];
    symptomTimeline: any[];
    doctorInstructions: any[];
    refillEvidence: any[];
    appointments: any[];
    familyNotes: any[];
    missingRecords: string[];
    questionsForDoctor: string[];
    safetyNotice: string;
  } | null;
  errors: string[];
  timestamp: string;
  error?: string;
};

const PATIENTS = [
  { id: "pat-001", name: "Raman Mehta", condition: "Diabetes follow-up" },
  { id: "pat-002", name: "Leela Shah", condition: "Hypertension review" },
  { id: "pat-003", name: "Dev Kapoor", condition: "Post-discharge medication reconciliation" },
];

export default function PacketPage() {
  const [selectedPatient, setSelectedPatient] = useState("pat-001");
  const [visitPurpose, setVisitPurpose] = useState("diabetes follow-up");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PacketResponse | null>(null);
  const [error, setError] = useState("");
  const [showSql, setShowSql] = useState(true);
  const [showRaw, setShowRaw] = useState(false);
  const [showRows, setShowRows] = useState(true);

  const patient = PATIENTS.find((p) => p.id === selectedPatient);

  const handleGenerate = async () => {
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch(`/api/care-packet?patientId=${selectedPatient}&purpose=${encodeURIComponent(visitPurpose)}`);
      if (!res.ok) throw new Error("Packet generation failed");
      const data: PacketResponse = await res.json();
      if (data.error) throw new Error(data.error);
      setResult(data);
    } catch (err: any) {
      setError(err.message || "Failed to generate packet");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Doctor Visit Packet Builder" eyebrow="Generated from real Coral SQL">
        Select a patient and visit purpose to generate a doctor-ready packet via real <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs font-mono">coral sql</code> queries.
      </PageHeader>

      <SafetyNotice />

      {/* Execution Mode Badge */}
      <div className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 p-4">
        <CheckCircle className="h-5 w-5 text-success shrink-0" />
        <div>
          <p className="text-sm font-medium text-green-800">
            Execution Mode: <Badge tone="success">Real Coral CLI</Badge>
          </p>
          <p className="text-xs text-green-600 mt-0.5">
            All queries run via <code className="font-mono">coral sql</code> against 9 registered CareOps sources
          </p>
        </div>
      </div>

      {/* Controls */}
      <Card>
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label className="block text-sm font-medium text-ink mb-1.5">Patient</label>
            <select
              value={selectedPatient}
              onChange={(e) => {
                setSelectedPatient(e.target.value);
                const p = PATIENTS.find((x) => x.id === e.target.value);
                if (p) setVisitPurpose(p.condition);
              }}
              className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm text-ink focus:border-info focus:outline-none focus:ring-1 focus:ring-info"
            >
              {PATIENTS.map((p) => (
                <option key={p.id} value={p.id}>{p.name} ({p.id})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-ink mb-1.5">Visit purpose</label>
            <input
              type="text"
              value={visitPurpose}
              onChange={(e) => setVisitPurpose(e.target.value)}
              placeholder="e.g. diabetes follow-up"
              className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm text-ink placeholder:text-muted focus:border-info focus:outline-none focus:ring-1 focus:ring-info"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={handleGenerate}
              disabled={loading || !visitPurpose.trim()}
              className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-ink px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              {loading ? "Generating..." : "Generate Packet"}
            </button>
          </div>
        </div>
      </Card>

      {/* Quick actions */}
      <div className="flex flex-wrap gap-2">
        {PATIENTS.map((p) => (
          <button
            key={p.id}
            onClick={() => { setSelectedPatient(p.id); setVisitPurpose(p.condition); }}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface px-3 py-1.5 text-xs text-muted hover:border-info hover:text-info disabled:opacity-50"
          >
            <Play className="h-3 w-3" />
            {p.name} — {p.condition}
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
            <div>
              <p className="text-sm font-medium text-ink">Running coral sql queries...</p>
              <p className="text-xs text-muted">Executing cross-source JOIN across 9 registered CareOps sources</p>
            </div>
          </div>
        </Card>
      )}

      {/* Packet Result */}
      {result?.packet && (
        <div className="space-y-4">
          {/* Stats */}
          <div className="flex flex-wrap gap-3">
            <Card className="flex-1 min-w-[200px]">
              <div className="flex items-center gap-2 text-sm font-medium text-ink">
                <Database className="h-4 w-4 text-info" /> Sources
              </div>
              <p className="mt-1 text-xs text-muted">{result.sourcesUsed.length} Coral sources</p>
            </Card>
            <Card className="flex-1 min-w-[200px]">
              <div className="flex items-center gap-2 text-sm font-medium text-ink">
                <Table2 className="h-4 w-4 text-info" /> Joined rows
              </div>
              <p className="mt-1 text-xs text-muted">{result.rowCount} rows via coral sql</p>
            </Card>
            <Card className="flex-1 min-w-[200px]">
              <div className="flex items-center gap-2 text-sm font-medium text-ink">
                <Timer className="h-4 w-4 text-info" /> Commands
              </div>
              <p className="mt-1 text-xs text-muted">{result.commands.length} coral CLI commands</p>
            </Card>
          </div>

          {/* Mode badge + export */}
          <Card>
            <div className="flex flex-wrap items-center gap-3">
              <ExportButton />
              <Badge tone="success">Generated from real Coral SQL</Badge>
              <Badge tone="info">{result.mode}</Badge>
            </div>
          </Card>

          {/* Command execution list */}
          <Card>
            <div className="flex items-center gap-2 mb-3">
              <Terminal className="h-4 w-4 text-info" />
              <h3 className="font-semibold text-ink">Coral CLI Commands Executed</h3>
            </div>
            <div className="space-y-1.5">
              {result.commands.map((cmd, i) => (
                <div key={i} className="flex items-start gap-2">
                  <CheckCircle className="h-3.5 w-3.5 text-success mt-1 shrink-0" />
                  <code className="text-xs font-mono text-info break-all">{cmd}</code>
                </div>
              ))}
            </div>
          </Card>

          {/* Patient */}
          {result.packet.patient && (
            <Card>
              <h3 className="font-semibold text-ink flex items-center gap-2">
                <Badge tone="info">Patient</Badge> {result.packet.patient.name}
              </h3>
              <p className="text-xs text-muted mt-1">
                {result.packet.patient.age}y · {result.packet.patient.gender} · {result.packet.patient.condition_focus} · {result.packet.patient.primary_doctor}
              </p>
            </Card>
          )}

          {/* Summary */}
          <Card>
            <h3 className="text-xl font-semibold">One-page doctor-ready packet</h3>
            <p className="mt-2 text-sm leading-6 text-muted">{result.packet.summary}</p>
          </Card>

          {/* Detail grid */}
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <h3 className="font-semibold">Current medicines</h3>
              <ul className="mt-3 space-y-2 text-sm">
                {result.packet.currentMedicines.length === 0 && <li className="text-muted italic">No current medicines</li>}
                {result.packet.currentMedicines.map((m: any) => (
                  <li key={m.medicine_name}>- {m.medicine_name} {m.dose}, {m.frequency}</li>
                ))}
              </ul>
            </Card>
            <Card>
              <h3 className="font-semibold">Recent labs</h3>
              <ul className="mt-3 space-y-2 text-sm">
                {result.packet.recentLabs.length === 0 && <li className="text-muted italic">No recent labs</li>}
                {result.packet.recentLabs.map((l: any) => (
                  <li key={`${l.test_name}-${l.report_date}`}>- {l.report_date}: {l.test_name} {l.value}{l.unit}</li>
                ))}
              </ul>
            </Card>
            <Card>
              <h3 className="font-semibold">Doctor instructions</h3>
              <ul className="mt-3 space-y-2 text-sm">
                {result.packet.doctorInstructions.length === 0 && <li className="text-muted italic">No instructions</li>}
                {result.packet.doctorInstructions.map((d: any) => (
                  <li key={`${d.date}-${d.instruction_type}`}>- {d.date}: {d.message}</li>
                ))}
              </ul>
            </Card>
            <Card>
              <h3 className="font-semibold">Refill status</h3>
              <ul className="mt-3 space-y-2 text-sm">
                {result.packet.refillEvidence.length === 0 && <li className="text-muted italic">No refill records</li>}
                {result.packet.refillEvidence.map((r: any) => (
                  <li key={`${r.medicine}-${r.date}`}>- {r.date}: {r.medicine}, {r.quantity}</li>
                ))}
              </ul>
            </Card>
          </div>

          {/* Symptom timeline */}
          {result.packet.symptomTimeline?.length > 0 && (
            <Card>
              <h3 className="font-semibold">Symptom timeline</h3>
              <ul className="mt-3 space-y-2 text-sm">
                {result.packet.symptomTimeline.map((s: any) => (
                  <li key={`${s.date}-${s.symptom}`}>- {s.date}: {s.symptom} (severity: {s.severity}/5) {s.related_medicine ? `— ${s.related_medicine}` : ""}</li>
                ))}
              </ul>
            </Card>
          )}

          {/* Appointments */}
          {result.packet.appointments?.length > 0 && (
            <Card>
              <h3 className="font-semibold">Appointments</h3>
              <ul className="mt-3 space-y-2 text-sm">
                {result.packet.appointments.map((a: any) => (
                  <li key={`${a.appointment_date}-${a.doctor}`}>- {a.appointment_date}: {a.doctor} ({a.speciality}) — {a.reason} [{a.status}]</li>
                ))}
              </ul>
            </Card>
          )}

          <MissingRecordAlert records={result.packet.missingRecords} />

          {/* Questions */}
          <Card>
            <h3 className="font-semibold">Questions to ask doctor</h3>
            <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-6">
              {result.packet.questionsForDoctor.map((question: string) => (
                <li key={question}>{question}</li>
              ))}
            </ol>
          </Card>

          {/* SQL */}
          <div className="rounded-lg border border-border overflow-hidden">
            <button onClick={() => setShowSql(!showSql)} className="flex w-full items-center justify-between bg-surface px-4 py-3 text-sm font-medium text-ink hover:bg-slate-100">
              <span className="flex items-center gap-2"><FileText className="h-4 w-4 text-info" /> Executed SQL Query</span>
              {showSql ? <ChevronRight className="h-4 w-4 rotate-90" /> : <ChevronRight className="h-4 w-4" />}
            </button>
            {showSql && <div className="bg-slate-950 p-4"><pre className="text-xs leading-5 text-slate-200 overflow-x-auto">{result.sql}</pre></div>}
          </div>

          {/* Raw Coral Output */}
          <div className="rounded-lg border border-border overflow-hidden">
            <button onClick={() => setShowRaw(!showRaw)} className="flex w-full items-center justify-between bg-surface px-4 py-3 text-sm font-medium text-ink hover:bg-slate-100">
              <span className="flex items-center gap-2"><Terminal className="h-4 w-4 text-info" /> Raw Coral Output ({result.commands.length} commands)</span>
              {showRaw ? <ChevronRight className="h-4 w-4 rotate-90" /> : <ChevronRight className="h-4 w-4" />}
            </button>
            {showRaw && (
              <pre className="bg-slate-950 p-4 text-[11px] leading-5 text-slate-300 overflow-x-auto max-h-96">
                {result.rawCoralOutput.substring(0, 10000)}
                {result.rawCoralOutput.length > 10000 ? "\n\n... (truncated)" : ""}
              </pre>
            )}
          </div>

          {/* Sources */}
          <div className="rounded-lg border border-border overflow-hidden">
            <button onClick={() => setShowSql(!showSql)} className="flex w-full items-center justify-between bg-surface px-4 py-3 text-sm font-medium text-ink hover:bg-slate-100">
              <span className="flex items-center gap-2"><Database className="h-4 w-4 text-info" /> Coral Sources ({result.sourcesUsed.length})</span>
              <ChevronRight className={`h-4 w-4 ${showSql ? "rotate-90" : ""}`} />
            </button>
            <div className="p-4 border-t border-border flex flex-wrap gap-2">
              {result.sourcesUsed.map((s) => (
                <Badge key={s} tone="success">{s}</Badge>
              ))}
            </div>
          </div>

          {/* Rows */}
          {result.joinedRows.length > 0 && (
            <div className="rounded-lg border border-border overflow-hidden">
              <button onClick={() => setShowRows(!showRows)} className="flex w-full items-center justify-between bg-surface px-4 py-3 text-sm font-medium text-ink hover:bg-slate-100">
                <span className="flex items-center gap-2"><Table2 className="h-4 w-4 text-info" /> Joined Results ({result.rowCount} rows)</span>
                {showRows ? <ChevronRight className="h-4 w-4 rotate-90" /> : <ChevronRight className="h-4 w-4" />}
              </button>
              {showRows && (
                <div className="overflow-x-auto border-t border-border">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-surface border-b border-border">
                        {Object.keys(result.joinedRows[0]).slice(0, 10).map((col) => (
                          <th key={col} className="px-3 py-2 text-left font-medium text-muted">{col}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {result.joinedRows.slice(0, 20).map((row, i) => (
                        <tr key={i} className="border-b border-border/50 last:border-0 hover:bg-surface/50">
                          {Object.keys(result.joinedRows[0]).slice(0, 10).map((col) => (
                            <td key={col} className="px-3 py-2 text-muted">{row[col] ?? "—"}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {result.joinedRows.length > 20 && <p className="p-3 text-xs text-muted border-t border-border">Showing first 20 of {result.rowCount} rows</p>}
                </div>
              )}
            </div>
          )}

          <p className="text-[10px] text-muted flex items-center gap-1">
            <Clock className="h-3 w-3" /> Generated at {new Date(result.timestamp).toLocaleString()} via {result.mode}
          </p>

          <SafetyNotice />
        </div>
      )}
    </div>
  );
}
