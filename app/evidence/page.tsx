"use client";

import { useState } from "react";
import { Badge, Card, PageHeader } from "@/components/ui";
import { Loader2, CheckCircle, XCircle, Terminal, Database, FileText, Table2, Play, RefreshCw, AlertCircle, Clock } from "lucide-react";

type SourceListResponse = {
  mode: string;
  command: string;
  rawOutput: string;
  sources: { name: string; version: string; origin: string }[];
  sourceCount: number;
  careOpsSources: { name: string; version: string; origin: string }[];
  careOpsCount: number;
  timestamp: string;
  error?: string;
};

type RunQueryResponse = {
  mode: string;
  patientId: string;
  visitPurpose: string;
  commands: string[];
  sourcesUsed: string[];
  sql: string;
  rawCoralOutput: string;
  executionTimeMs: number;
  joinedRows: Record<string, any>[];
  rowCount: number;
  error: string | null;
  timestamp: string;
};

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

type ActionStatus = "idle" | "running" | "success" | "error";

export default function EvidencePage() {
  const [sourceStatus, setSourceStatus] = useState<ActionStatus>("idle");
  const [queryStatus, setQueryStatus] = useState<ActionStatus>("idle");
  const [packetStatus, setPacketStatus] = useState<ActionStatus>("idle");

  const [sourceResult, setSourceResult] = useState<SourceListResponse | null>(null);
  const [queryResult, setQueryResult] = useState<RunQueryResponse | null>(null);
  const [packetResult, setPacketResult] = useState<PacketResponse | null>(null);

  const [error, setError] = useState("");
  const [timestamp, setTimestamp] = useState("");

  const verifySources = async () => {
    setSourceStatus("running");
    setError("");
    try {
      const res = await fetch("/api/coral/source-list");
      const data: SourceListResponse = await res.json();
      setSourceResult(data);
      setTimestamp(data.timestamp);
      setSourceStatus(data.error ? "error" : "success");
      if (data.error) setError(data.error);
    } catch (err: any) {
      setSourceStatus("error");
      setError(err.message);
    }
  };

  const runQuery = async () => {
    setQueryStatus("running");
    setError("");
    try {
      const res = await fetch("/api/coral/run-query?patientId=pat-001&purpose=diabetes%20follow-up");
      const data: RunQueryResponse = await res.json();
      setQueryResult(data);
      setTimestamp(data.timestamp);
      setQueryStatus(data.error ? "error" : "success");
      if (data.error) setError(data.error);
    } catch (err: any) {
      setQueryStatus("error");
      setError(err.message);
    }
  };

  const generatePacket = async () => {
    setPacketStatus("running");
    setError("");
    try {
      const res = await fetch("/api/care-packet?patientId=pat-001&purpose=diabetes%20follow-up");
      const data: PacketResponse = await res.json();
      setPacketResult(data);
      setTimestamp(data.timestamp);
      setPacketStatus(data.error ? "error" : "success");
      if (data.error) setError(data.error);
    } catch (err: any) {
      setPacketStatus("error");
      setError(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Coral SQL Evidence" eyebrow="Real Coral CLI execution proof">
        This page runs real <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs font-mono">coral sql</code> commands against registered CareOps sources.
        No simulation, no SQLite fallback.
      </PageHeader>

      {/* Execution Mode Badge */}
      <Card>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Terminal className="h-5 w-5 text-info" />
            <div>
              <h3 className="font-semibold text-ink">Execution Mode</h3>
              <p className="text-sm text-muted">All commands run via real Coral CLI</p>
            </div>
          </div>
          <Badge tone="success">Real Coral CLI</Badge>
        </div>
      </Card>

      {/* Action Buttons */}
      <div className="grid gap-3 md:grid-cols-3">
        <button
          onClick={verifySources}
          disabled={sourceStatus === "running"}
          className="flex items-center gap-3 rounded-lg border border-border bg-white p-4 text-left hover:border-info hover:bg-blue-50/30 disabled:opacity-50"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
            {sourceStatus === "running" ? (
              <Loader2 className="h-5 w-5 animate-spin text-info" />
            ) : sourceStatus === "success" ? (
              <CheckCircle className="h-5 w-5 text-success" />
            ) : sourceStatus === "error" ? (
              <XCircle className="h-5 w-5 text-danger" />
            ) : (
              <Database className="h-5 w-5 text-info" />
            )}
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-ink">Verify Coral Sources</h3>
            <p className="text-xs text-muted">Run coral source list</p>
          </div>
          <Play className="h-4 w-4 text-muted shrink-0" />
        </button>

        <button
          onClick={runQuery}
          disabled={queryStatus === "running"}
          className="flex items-center gap-3 rounded-lg border border-border bg-white p-4 text-left hover:border-info hover:bg-blue-50/30 disabled:opacity-50"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
            {queryStatus === "running" ? (
              <Loader2 className="h-5 w-5 animate-spin text-success" />
            ) : queryStatus === "success" ? (
              <CheckCircle className="h-5 w-5 text-success" />
            ) : queryStatus === "error" ? (
              <XCircle className="h-5 w-5 text-danger" />
            ) : (
              <FileText className="h-5 w-5 text-success" />
            )}
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-ink">Run Live Coral Query</h3>
            <p className="text-xs text-muted">Execute cross-source JOIN via coral sql</p>
          </div>
          <Play className="h-4 w-4 text-muted shrink-0" />
        </button>

        <button
          onClick={generatePacket}
          disabled={packetStatus === "running"}
          className="flex items-center gap-3 rounded-lg border border-border bg-white p-4 text-left hover:border-info hover:bg-blue-50/30 disabled:opacity-50"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100">
            {packetStatus === "running" ? (
              <Loader2 className="h-5 w-5 animate-spin text-purple-600" />
            ) : packetStatus === "success" ? (
              <CheckCircle className="h-5 w-5 text-success" />
            ) : packetStatus === "error" ? (
              <XCircle className="h-5 w-5 text-danger" />
            ) : (
              <RefreshCw className="h-5 w-5 text-purple-600" />
            )}
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-ink">Generate Packet from Coral</h3>
            <p className="text-xs text-muted">Full packet via real coral sql queries</p>
          </div>
          <Play className="h-4 w-4 text-muted shrink-0" />
        </button>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-danger shrink-0 mt-0.5" />
            <p className="text-sm text-danger">{error}</p>
          </div>
        </Card>
      )}

      {/* Source Verification Result */}
      {sourceResult && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-ink flex items-center gap-2">
              <Database className="h-4 w-4 text-info" /> Coral Source List
            </h3>
            <div className="flex items-center gap-2">
              <Badge tone={sourceResult.careOpsCount === 9 ? "success" : "warning"}>
                {sourceResult.careOpsCount} CareOps sources
              </Badge>
              <Badge tone="info">{sourceResult.mode}</Badge>
            </div>
          </div>

          <div className="grid gap-2 md:grid-cols-3 mb-4">
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

          <div className="flex flex-wrap gap-2 mb-4">
            {sourceResult.careOpsSources.map((s) => (
              <Badge key={s.name} tone="success">
                {s.name} v{s.version}
              </Badge>
            ))}
          </div>

          <details className="border border-border rounded">
            <summary className="cursor-pointer px-3 py-2 text-xs font-medium text-ink hover:bg-surface/50 flex items-center gap-2">
              <Terminal className="h-3 w-3" /> View Raw Command Output
            </summary>
            <pre className="px-3 pb-3 pt-1 text-[11px] font-mono text-muted leading-5 overflow-x-auto max-h-60">
              $ {sourceResult.command}
              {"\n"}
              {sourceResult.rawOutput}
            </pre>
          </details>
        </Card>
      )}

      {/* Query Result */}
      {queryResult && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-ink flex items-center gap-2">
              <FileText className="h-4 w-4 text-success" /> Cross-Source Join Result
            </h3>
            <div className="flex items-center gap-2">
              <Badge tone={queryResult.rowCount > 0 ? "success" : "warning"}>
                {queryResult.rowCount} rows
              </Badge>
              <Badge tone="info">{queryResult.executionTimeMs}ms</Badge>
              <Badge tone="success">{queryResult.mode}</Badge>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mb-4">
            {queryResult.sourcesUsed.map((s) => (
              <Badge key={s} tone="info">
                {s}
              </Badge>
            ))}
          </div>

          <details className="border border-border rounded mb-3">
            <summary className="cursor-pointer px-3 py-2 text-xs font-medium text-ink hover:bg-surface/50 flex items-center gap-2">
              <Terminal className="h-3 w-3" /> View Executed SQL
            </summary>
            <pre className="px-3 pb-3 pt-1 text-[11px] font-mono text-slate-200 bg-slate-950 leading-5 overflow-x-auto max-h-80">
              {queryResult.sql}
            </pre>
          </details>

          <details className="border border-border rounded mb-3">
            <summary className="cursor-pointer px-3 py-2 text-xs font-medium text-ink hover:bg-surface/50 flex items-center gap-2">
              <Terminal className="h-3 w-3" /> View Raw Coral Output
            </summary>
            <pre className="px-3 pb-3 pt-1 text-[11px] font-mono text-muted leading-5 overflow-x-auto max-h-60">
              {queryResult.rawCoralOutput}
            </pre>
          </details>

          {queryResult.joinedRows.length > 0 && (
            <details className="border border-border rounded">
              <summary className="cursor-pointer px-3 py-2 text-xs font-medium text-ink hover:bg-surface/50 flex items-center gap-2">
                <Table2 className="h-3 w-3" /> View Joined Rows ({queryResult.rowCount} rows)
              </summary>
              <div className="overflow-x-auto border-t border-border">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-surface border-b border-border">
                      {Object.keys(queryResult.joinedRows[0]).slice(0, 10).map((col) => (
                        <th key={col} className="px-3 py-2 text-left font-medium text-muted">{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {queryResult.joinedRows.slice(0, 20).map((row, i) => (
                      <tr key={i} className="border-b border-border/50 last:border-0 hover:bg-surface/50">
                        {Object.keys(queryResult.joinedRows[0]).slice(0, 10).map((col) => (
                          <td key={col} className="px-3 py-2 text-muted">{row[col] ?? "—"}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {queryResult.joinedRows.length > 20 && (
                  <p className="p-3 text-xs text-muted border-t border-border">Showing first 20 of {queryResult.rowCount} rows</p>
                )}
                <p className="p-2 text-[10px] text-muted border-t border-border flex items-center gap-1">
                  <Clock className="h-3 w-3" /> {new Date(timestamp).toLocaleString()}
                </p>
              </div>
            </details>
          )}
        </Card>
      )}

      {/* Packet Result */}
      {packetResult?.packet && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-ink flex items-center gap-2">
              <RefreshCw className="h-4 w-4 text-purple-600" /> Packet from Coral
            </h3>
            <div className="flex items-center gap-2">
              <Badge tone="success">Generated from real Coral SQL</Badge>
              <Badge tone="info">{packetResult.mode}</Badge>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mb-4">
            {packetResult.sourcesUsed.map((s) => (
              <Badge key={s} tone="success">{s}</Badge>
            ))}
          </div>

          <p className="text-sm leading-6 text-muted mb-4">{packetResult.packet.summary}</p>

          <details className="border border-border rounded mb-3">
            <summary className="cursor-pointer px-3 py-2 text-xs font-medium text-ink hover:bg-surface/50 flex items-center gap-2">
              <Terminal className="h-3 w-3" /> View All {packetResult.commands.length} Commands
            </summary>
            <div className="px-3 pb-3 pt-1 space-y-1">
              {packetResult.commands.map((cmd, i) => (
                <code key={i} className="block text-[11px] font-mono text-info leading-5">$ {cmd}</code>
              ))}
            </div>
          </details>

          <details className="border border-border rounded">
            <summary className="cursor-pointer px-3 py-2 text-xs font-medium text-ink hover:bg-surface/50 flex items-center gap-2">
              <Terminal className="h-3 w-3" /> View 10 Raw Coral Outputs
            </summary>
            <pre className="px-3 pb-3 pt-1 text-[11px] font-mono text-muted leading-5 overflow-x-auto max-h-80">
              {packetResult.rawCoralOutput.substring(0, 5000)}
              {packetResult.rawCoralOutput.length > 5000 ? "\n\n... (truncated)" : ""}
            </pre>
          </details>

          {/* Packet sections */}
          <div className="grid gap-4 lg:grid-cols-2 mt-4">
            <div className="rounded border border-border p-3">
              <h4 className="text-xs font-semibold text-ink">Current medicines</h4>
              <ul className="mt-2 space-y-1 text-xs text-muted">
                {packetResult.packet.currentMedicines.map((m: any, i: number) => (
                  <li key={i}>- {m.medicine_name} {m.dose}, {m.frequency}</li>
                ))}
                {packetResult.packet.currentMedicines.length === 0 && <li className="italic">None</li>}
              </ul>
            </div>
            <div className="rounded border border-border p-3">
              <h4 className="text-xs font-semibold text-ink">Recent labs</h4>
              <ul className="mt-2 space-y-1 text-xs text-muted">
                {packetResult.packet.recentLabs.map((l: any, i: number) => (
                  <li key={i}>- {l.report_date}: {l.test_name} {l.value}{l.unit}</li>
                ))}
                {packetResult.packet.recentLabs.length === 0 && <li className="italic">None</li>}
              </ul>
            </div>
            <div className="rounded border border-border p-3">
              <h4 className="text-xs font-semibold text-ink">Doctor instructions</h4>
              <ul className="mt-2 space-y-1 text-xs text-muted">
                {packetResult.packet.doctorInstructions.map((d: any, i: number) => (
                  <li key={i}>- {d.date}: {d.message}</li>
                ))}
                {packetResult.packet.doctorInstructions.length === 0 && <li className="italic">None</li>}
              </ul>
            </div>
            <div className="rounded border border-border p-3">
              <h4 className="text-xs font-semibold text-ink">Refill evidence</h4>
              <ul className="mt-2 space-y-1 text-xs text-muted">
                {packetResult.packet.refillEvidence.map((r: any, i: number) => (
                  <li key={i}>- {r.date}: {r.medicine}, {r.quantity}</li>
                ))}
                {packetResult.packet.refillEvidence.length === 0 && <li className="italic">None</li>}
              </ul>
            </div>
          </div>

          {packetResult.packet.missingRecords.length > 0 && (
            <div className="mt-4 rounded border border-amber-200 bg-amber-50 p-3">
              <h4 className="text-xs font-semibold text-amber-800">Missing records</h4>
              <ul className="mt-1 space-y-1 text-xs text-amber-700">
                {packetResult.packet.missingRecords.map((m: string, i: number) => (
                  <li key={i}>- {m}</li>
                ))}
              </ul>
            </div>
          )}

          {packetResult.packet.questionsForDoctor.length > 0 && (
            <div className="mt-4">
              <h4 className="text-xs font-semibold text-ink">Questions for doctor</h4>
              <ol className="mt-2 list-decimal space-y-1 pl-5 text-xs text-muted">
                {packetResult.packet.questionsForDoctor.map((q: string, i: number) => (
                  <li key={i}>{q}</li>
                ))}
              </ol>
            </div>
          )}

          <p className="mt-4 text-xs text-muted border-t border-border pt-3 flex items-center gap-1">
            <Clock className="h-3 w-3" /> Generated at {new Date(timestamp).toLocaleString()}
          </p>
        </Card>
      )}
    </div>
  );
}
