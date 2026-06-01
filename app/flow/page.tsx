"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  FileImage, FlaskRound, MessageSquare, Receipt, Activity,
  Calendar, Users, Heart, Database, Pill, Stethoscope,
  AlertCircle, HelpCircle, ArrowRight, ArrowRightCircle,
  Loader2, CheckCircle2, XCircle, Play, RefreshCw, FileText,
  Terminal, BarChart3, Clock, ShieldAlert, Zap, MoveRight
} from "lucide-react";

const DATA_SOURCES = [
  { key: "prescriptionOcr", icon: FileImage, label: "Prescription photos", color: "border-cyan-200 bg-cyan-50 text-cyan-600", iconBg: "bg-cyan-100" },
  { key: "labReports", icon: FlaskRound, label: "Lab reports", color: "border-blue-200 bg-blue-50 text-blue-600", iconBg: "bg-blue-100" },
  { key: "doctorChats", icon: MessageSquare, label: "Doctor chats", color: "border-teal-200 bg-teal-50 text-teal-600", iconBg: "bg-teal-100" },
  { key: "pharmacyReceipts", icon: Receipt, label: "Pharmacy receipts", color: "border-sky-200 bg-sky-50 text-sky-600", iconBg: "bg-sky-100" },
  { key: "symptomLogs", icon: Activity, label: "Symptom notes", color: "border-emerald-200 bg-emerald-50 text-emerald-600", iconBg: "bg-emerald-100" },
  { key: "appointments", icon: Calendar, label: "Appointments", color: "border-indigo-200 bg-indigo-50 text-indigo-600", iconBg: "bg-indigo-100" },
  { key: "familyNotes", icon: Users, label: "Family notes", color: "border-violet-200 bg-violet-50 text-violet-600", iconBg: "bg-violet-100" },
  { key: "medications", icon: Heart, label: "Medications", color: "border-rose-200 bg-rose-50 text-rose-600", iconBg: "bg-rose-100" },
];

const CORAL_ACTIONS = [
  { label: "Connecting care sources", desc: "Linking all 9 data sources" },
  { label: "Normalizing schemas", desc: "Mapping fields to unified columns" },
  { label: "Structuring records", desc: "Sorting by date, type, relevance" },
  { label: "Verifying & linking", desc: "Cross-referencing related records" },
];

const PACKET_SECTIONS = [
  { key: "currentMedicines", icon: Pill, label: "Current medicines", desc: "Active prescriptions with dosages" },
  { key: "recentLabs", icon: Stethoscope, label: "Recent labs", desc: "Latest test results & trends" },
  { key: "symptomTimeline", icon: Activity, label: "Symptom timeline", desc: "Symptoms mapped to dates & meds" },
  { key: "doctorInstructions", icon: MessageSquare, label: "Doctor instructions", desc: "Care instructions from visits" },
  { key: "refillEvidence", icon: Receipt, label: "Refill evidence", desc: "Pharmacy receipts & pickups" },
  { key: "missingRecords", icon: AlertCircle, label: "Missing records", desc: "Gaps detected automatically" },
  { key: "questionsForDoctor", icon: HelpCircle, label: "Questions for doctor", desc: "Pre-visit question list" },
];

type FlowPhase = "idle" | "collecting" | "processing" | "packet" | "done";

export default function FlowPage() {
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [packet, setPacket] = useState<any>(null);
  const [phase, setPhase] = useState<FlowPhase>("idle");
  const [collectIdx, setCollectIdx] = useState(-1);
  const [processIdx, setProcessIdx] = useState(-1);
  const [packetIdx, setPacketIdx] = useState(-1);
  const flowRef = useRef(false);

  useEffect(() => {
    fetch("/api/data/counts").then(r => r.json()).then(d => {
      if (d.counts) setCounts(d.counts);
    }).finally(() => setLoading(false));
  }, []);

  const runPipeline = useCallback(async () => {
    if (flowRef.current) return;
    flowRef.current = true;

    setPacket(null);
    setCollectIdx(-1);
    setProcessIdx(-1);
    setPacketIdx(-1);

    // === PHASE 1: Collecting (one by one) ===
    setPhase("collecting");
    for (let i = 0; i < DATA_SOURCES.length; i++) {
      setCollectIdx(i);
      await new Promise(r => setTimeout(r, 350));
    }
    await new Promise(r => setTimeout(r, 300));
    setCollectIdx(-1);

    // === PHASE 2: Processing (one by one) ===
    setPhase("processing");
    for (let i = 0; i < CORAL_ACTIONS.length; i++) {
      setProcessIdx(i);
      await new Promise(r => setTimeout(r, 500));
    }
    await new Promise(r => setTimeout(r, 300));
    setProcessIdx(-1);

    // === PHASE 3: Packet generation ===
    setPhase("packet");
    try {
      const res = await fetch("/api/packet?patientId=pat-001&purpose=diabetes follow-up");
      const data = await res.json();
      setPacket(data);
    } catch {
      // ignore
    }

    // Animate packet sections one by one
    for (let i = 0; i < PACKET_SECTIONS.length; i++) {
      setPacketIdx(i);
      await new Promise(r => setTimeout(r, 250));
    }

    setPhase("done");
    flowRef.current = false;
  }, []);

  const canRun = phase === "idle" || phase === "done";
  const totalSources = DATA_SOURCES.length;
  const populatedSources = DATA_SOURCES.filter(s => (counts[s.key] || 0) > 0).length;

  const phaseLabel = (p: FlowPhase) => {
    switch (p) {
      case "collecting": return `Collecting records (${Math.min(collectIdx + 1, DATA_SOURCES.length)}/${DATA_SOURCES.length})`;
      case "processing": return `Processing (${processIdx + 1}/${CORAL_ACTIONS.length})`;
      case "packet": return packet ? "Building packet..." : "Generating...";
      case "done": return `Packet ready · ${Object.values(counts).reduce((a, b) => a + b, 0)} records`;
      default: return `${populatedSources}/${totalSources} sources connected`;
    }
  };

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-info/20 bg-info/5 px-4 py-1.5 text-xs font-medium text-info">
            <Zap className="h-3.5 w-3.5" />
            {phaseLabel(phase)}
          </div>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-ink">
            Scattered records →{" "}
            <span className="bg-gradient-to-r from-info to-teal-500 bg-clip-text text-transparent">
              structured packet
            </span>
          </h1>
          <p className="mt-2 text-sm text-muted">
            Watch each record get collected, processed through Coral, and assembled into a doctor packet
          </p>
        </div>
        <button
          onClick={runPipeline}
          disabled={!canRun}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-info to-teal-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-info/20 hover:shadow-xl hover:shadow-info/30 disabled:opacity-50 transition-all"
        >
          {phase === "idle" ? <Play className="h-4 w-4" /> : phase === "done" ? <RefreshCw className="h-4 w-4" /> : <Loader2 className="h-4 w-4 animate-spin" />}
          {phase === "idle" ? "Run full pipeline" : phase === "done" ? "Run again" : "Running..."}
        </button>
      </div>

      {/* Pipeline grid */}
      <div className="grid gap-5 lg:grid-cols-[1.2fr_auto_1.5fr_auto_1.2fr] items-start">

        {/* ===== LEFT: Scattered Records ===== */}
        <div className="space-y-3">
          <div className="flex items-center gap-2.5 mb-3">
            <div className={`flex h-8 w-8 items-center justify-center rounded-lg transition-all duration-300 ${phase === "collecting" ? "bg-orange-400 shadow-lg shadow-orange-200" : "bg-orange-100"}`}>
              <BarChart3 className={`h-4 w-4 ${phase === "collecting" ? "text-white" : "text-orange-600"}`} />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-ink">Scattered Records</h2>
              <p className="text-[11px] text-muted">
                {phase === "collecting"
                  ? `Collecting ${DATA_SOURCES[collectIdx]?.label.toLowerCase() || ""}...`
                  : `${Object.values(counts).reduce((a, b) => a + b, 0)} records to organize`}
              </p>
            </div>
          </div>
          <div className="relative space-y-2">
            {DATA_SOURCES.map((s, i) => {
              const Icon = s.icon;
              const count = counts[s.key] || 0;
              const isCollected = phase === "collecting" && i <= collectIdx;
              const isDone = phase !== "idle" && !(phase === "collecting" && i > collectIdx);
              const isCurrent = phase === "collecting" && i === collectIdx;

              return (
                <div
                  key={s.key}
                  className={`relative flex items-center gap-3 rounded-xl border-2 px-4 py-3 shadow-sm transition-all duration-300 ${
                    isCurrent
                      ? `${s.color} shadow-lg scale-[1.02] -translate-y-0.5`
                      : isCollected
                        ? `${s.color} opacity-90`
                        : isDone && phase !== "collecting"
                          ? `${s.color} opacity-70`
                          : "border-slate-200 bg-white text-slate-300"
                  }`}
                >
                  <div className={`flex h-8 w-8 items-center justify-center rounded-lg transition-all ${isCurrent ? "bg-white shadow-sm scale-110" : count > 0 ? s.iconBg : "bg-slate-100"}`}>
                    <Icon className={`h-4 w-4 ${count > 0 || isCollected ? "" : "text-slate-300"}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className={`text-sm font-medium ${count > 0 || isCollected ? "" : "text-slate-300"}`}>{s.label}</span>
                      {!loading && (
                        <span className={`text-xs font-mono font-semibold tabular-nums ml-2 ${count > 0 ? "" : "text-slate-200"}`}>
                          {count}
                        </span>
                      )}
                    </div>
                    <div className="mt-1.5 h-1 w-full rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${isCollected ? "bg-current opacity-60" : "bg-transparent"}`}
                        style={{ width: isCollected ? "100%" : "0%" }}
                      />
                    </div>
                  </div>

                  {/* Individual arrow that appears when collected */}
                  {isCollected && (
                    <div className="absolute -right-3 top-1/2 -translate-y-1/2 translate-x-full hidden lg:block z-10">
                      <div className="flex items-center gap-0">
                        <div className="h-px w-4 bg-current opacity-40" />
                        <ArrowRightCircle className={`h-5 w-5 -ml-1 ${isCurrent ? "text-info animate-pulse" : "text-info/60"}`} />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ARROW 1 (big connector between columns) */}
        <div className="flex items-center justify-center self-stretch">
          <div className={`hidden lg:flex flex-col items-center transition-all duration-500 ${
            phase === "collecting" ? "opacity-100" : phase === "idle" ? "opacity-30" : "opacity-70"
          }`}>
            <div className={`h-12 w-12 flex items-center justify-center rounded-full shadow-lg transition-all duration-300 ${
              phase === "collecting"
                ? "bg-gradient-to-br from-info to-teal-500 scale-110 shadow-info/30"
                : "bg-gradient-to-br from-info/60 to-teal-500/60"
            }`}>
              <ArrowRight className={`h-5 w-5 text-white ${phase === "collecting" ? "animate-pulse" : ""}`} />
            </div>
            <span className="mt-2 text-[10px] font-medium text-muted whitespace-nowrap">
              {phase === "collecting" ? `${collectIdx + 1} of ${DATA_SOURCES.length} collected` : "collecting"}
            </span>
          </div>
          <div className="flex lg:hidden items-center justify-center py-2">
            <MoveRight className="h-5 w-5 text-muted" />
          </div>
        </div>

        {/* ===== CENTER: Coral SQL Layer ===== */}
        <div className="space-y-3">
          <div className="flex items-center gap-2.5 mb-3">
            <div className={`flex h-8 w-8 items-center justify-center rounded-lg transition-all duration-300 ${phase === "processing" ? "bg-info shadow-lg shadow-info/30 scale-110" : "bg-info/10"}`}>
              <Database className={`h-4 w-4 ${phase === "processing" ? "text-white" : "text-info"}`} />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-ink">Coral SQL Layer</h2>
              <p className="text-[11px] text-muted">
                {phase === "processing"
                  ? CORAL_ACTIONS[processIdx]?.desc || ""
                  : phase === "idle" ? "Normalize · Structure · Verify" : "Processing complete"}
              </p>
            </div>
          </div>

          <div className={`rounded-2xl border-2 p-6 shadow-xl transition-all duration-500 ${
            phase === "processing"
              ? "border-info/30 bg-gradient-to-br from-blue-50 via-white to-teal-50 shadow-info/10"
              : phase !== "idle"
                ? "border-info/20 bg-gradient-to-br from-blue-50/50 via-white to-teal-50/50"
                : "border-info/5 bg-slate-50/50"
          }`}>
            <div className="flex items-center gap-3 mb-5">
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-300 ${phase === "processing" ? "bg-info shadow-md shadow-info/30 scale-110" : "bg-info/50"}`}>
                <Database className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-ink">Coral</h3>
                <p className="text-[11px] text-muted">Unified query engine</p>
              </div>
            </div>

            <div className="space-y-2.5">
              {CORAL_ACTIONS.map((action, i) => {
                const isActive = phase === "processing" && i === processIdx;
                const isDone = phase !== "idle" && (phase !== "processing" || i <= processIdx);
                const isWaiting = phase === "processing" && i > processIdx;

                return (
                  <div
                    key={action.label}
                    className={`flex items-center gap-3 rounded-xl border px-4 py-3 shadow-sm transition-all duration-300 ${
                      isActive
                        ? "border-info/30 bg-white shadow-md translate-x-1"
                        : isDone
                          ? "border-info/10 bg-white/80"
                          : "border-slate-100 bg-white/50"
                    }`}
                  >
                    <div className={`flex h-7 w-7 items-center justify-center rounded-full transition-all ${
                      isActive ? "bg-info/20 scale-110" : isDone ? "bg-info/5" : "bg-slate-50"
                    }`}>
                      {isActive ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-info" />
                      ) : isDone ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-info/70" />
                      ) : (
                        <div className="h-3.5 w-3.5 rounded-full border-2 border-slate-200" />
                      )}
                    </div>
                    <div className="flex-1">
                      <span className={`text-sm font-medium ${isActive ? "text-info" : isDone ? "text-ink" : "text-slate-300"}`}>
                        {action.label}
                      </span>
                      {isActive && (
                        <p className="text-[10px] text-info/70 mt-0.5">{action.desc}</p>
                      )}
                    </div>
                    {isActive && (
                      <span className="text-[10px] font-mono text-info/50">{processIdx + 1}/{CORAL_ACTIONS.length}</span>
                    )}
                  </div>
                );
              })}
            </div>

            <div className={`mt-4 rounded-xl border px-4 py-3 text-center transition-all ${
              phase !== "idle" ? "border-info/15 bg-white/80" : "border-slate-100 bg-white/50"
            }`}>
              <p className="text-[11px] font-medium text-muted">
                9 sources · 1 SQL interface · 3 query modes
              </p>
            </div>
          </div>
        </div>

        {/* ARROW 2 (big connector between columns) */}
        <div className="flex items-center justify-center self-stretch">
          <div className={`hidden lg:flex flex-col items-center transition-all duration-500 ${
            phase === "processing" || phase === "packet" ? "opacity-100" : phase === "idle" ? "opacity-30" : "opacity-50"
          }`}>
            <div className={`h-12 w-12 flex items-center justify-center rounded-full shadow-lg transition-all duration-300 ${
              phase === "packet"
                ? "bg-gradient-to-br from-teal-400 to-emerald-500 scale-110 shadow-teal-200"
                : phase === "processing"
                  ? "bg-gradient-to-br from-teal-400 to-emerald-500 shadow-teal-200"
                  : "bg-gradient-to-br from-teal-300/60 to-emerald-400/60"
            }`}>
              <ArrowRight className={`h-5 w-5 text-white ${phase === "packet" ? "animate-pulse" : ""}`} />
            </div>
            <span className="mt-2 text-[10px] font-medium text-muted whitespace-nowrap">
              {phase === "packet" ? "building packet..." : "structuring"}
            </span>
          </div>
          <div className="flex lg:hidden items-center justify-center py-2">
            <MoveRight className="h-5 w-5 text-muted" />
          </div>
        </div>

        {/* ===== RIGHT: Doctor-Ready Packet ===== */}
        <div className="space-y-3">
          <div className="flex items-center gap-2.5 mb-3">
            <div className={`flex h-8 w-8 items-center justify-center rounded-lg transition-all duration-300 ${phase === "packet" || phase === "done" ? "bg-emerald-400 shadow-lg shadow-emerald-200" : "bg-emerald-100"}`}>
              <FileText className={`h-4 w-4 ${phase === "packet" || phase === "done" ? "text-white" : "text-emerald-600"}`} />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-ink">Doctor-Ready Packet</h2>
              <p className="text-[11px] text-muted">
                {phase === "packet"
                  ? packet ? `Assembling sections...` : "Generating from Coral..."
                  : phase === "done"
                    ? packet ? `Ready for ${packet.patient?.name || "visit"}` : "Complete"
                    : "Structured for clinic visits"}
              </p>
            </div>
          </div>
          <div className="space-y-2">
            {PACKET_SECTIONS.map((p, i) => {
              const Icon = p.icon;
              const packetData = packet?.[p.key];
              const hasData = Array.isArray(packetData) ? packetData.length > 0 : !!packetData;
              const count = Array.isArray(packetData) ? packetData.length : (packetData ? 1 : 0);
              const isRevealed = phase === "done" ? i <= packetIdx : false;
              const isRevealing = phase === "packet" && i <= packetIdx;

              return (
                <div
                  key={p.key}
                  className={`flex items-start gap-3 rounded-xl border-2 px-4 py-3 shadow-sm transition-all duration-500 ${
                    isRevealed && hasData
                      ? "border-emerald-200 bg-gradient-to-r from-emerald-50 to-white opacity-100 translate-x-0"
                      : isRevealed && packet
                        ? "border-amber-200 bg-amber-50/50 opacity-100 translate-x-0"
                        : isRevealing
                          ? "border-info/20 bg-blue-50 opacity-80"
                          : "border-slate-100 bg-white opacity-30"
                  }`}
                  style={{
                    transitionDelay: phase === "done" || phase === "packet" ? `${i * 80}ms` : "0ms",
                  }}
                >
                  <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
                    isRevealed && hasData ? "bg-emerald-100" : isRevealed && packet ? "bg-amber-100" : "bg-slate-100"
                  }`}>
                    {isRevealing && !hasData && !packet ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-info" />
                    ) : (
                      <Icon className={`h-3.5 w-3.5 ${isRevealed && hasData ? "text-emerald-600" : isRevealed && packet ? "text-amber-500" : "text-slate-300"}`} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className={`text-sm font-medium ${isRevealed && hasData ? "text-ink" : isRevealed && packet ? "text-amber-700" : "text-slate-400"}`}>
                        {p.label}
                      </span>
                      {isRevealed && hasData && (
                        <span className="text-xs font-mono font-semibold tabular-nums text-emerald-600 shrink-0 ml-2">{count}</span>
                      )}
                      {isRevealed && packet && !hasData && (
                        <XCircle className="h-3.5 w-3.5 text-amber-400 shrink-0 ml-2" />
                      )}
                    </div>
                    <p className={`text-[11px] mt-0.5 ${isRevealed && hasData ? "text-muted" : isRevealed && packet ? "text-amber-600/70" : "text-slate-300"}`}>
                      {isRevealed && hasData ? p.desc : isRevealed && packet ? "Not available" : p.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Packet summary */}
      {packet && phase === "done" && (
        <div className="rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-white p-5 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-500">
          <div className="flex items-center gap-3 mb-3">
            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            <h3 className="font-semibold text-ink">
              Packet ready for {packet.patient?.name || "patient"}
            </h3>
            <span className="text-xs text-muted ml-auto">
              {packet.evidenceRows?.length || 0} evidence rows from {packet.sourcesUsed?.length || 0} sources
            </span>
          </div>
          <p className="text-sm text-muted leading-6">{packet.summary}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-white px-3 py-1 text-[11px] font-medium text-emerald-700">
              <Clock className="h-3 w-3" />
              {new Date(packet.generatedAt).toLocaleTimeString()}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-white px-3 py-1 text-[11px] font-medium text-emerald-700">
              <Terminal className="h-3 w-3" />
              {packet.sourcesUsed?.length || 0} sources
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-white px-3 py-1 text-[11px] font-medium text-emerald-700">
              <BarChart3 className="h-3 w-3" />
              {packet.evidenceRows?.length || 0} evidence rows
            </span>
          </div>
        </div>
      )}

      {/* Safety line */}
      <div className="flex items-center justify-center gap-3 rounded-2xl border border-amber-200 bg-amber-50/80 px-6 py-4 shadow-sm">
        <ShieldAlert className="h-5 w-5 shrink-0 text-amber-500" />
        <p className="text-sm font-medium text-amber-700">
          Not diagnosis. Not prescriptions. Record organization for doctor visits.
        </p>
      </div>

    </div>
  );
}
