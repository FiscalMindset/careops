"use client";

import { useState, useEffect, useCallback } from "react";
import {
  FileImage, FlaskRound, MessageSquare, Receipt, Activity,
  Calendar, Users, Heart, Database, Pill, Stethoscope,
  AlertCircle, HelpCircle, ArrowRight, ChevronRight, Layers,
  Loader2, CheckCircle2, XCircle, Play, RefreshCw, FileText,
  Terminal, BarChart3, Clock, ShieldAlert
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

const PACKET_SECTIONS = [
  { key: "currentMedicines", icon: Pill, label: "Current medicines", desc: "Active prescriptions with dosages", color: "text-emerald-600" },
  { key: "recentLabs", icon: Stethoscope, label: "Recent labs", desc: "Latest test results & trends", color: "text-blue-600" },
  { key: "symptomTimeline", icon: Activity, label: "Symptom timeline", desc: "Symptoms mapped to dates & meds", color: "text-emerald-600" },
  { key: "doctorInstructions", icon: MessageSquare, label: "Doctor instructions", desc: "Care instructions from visits", color: "text-teal-600" },
  { key: "refillEvidence", icon: Receipt, label: "Refill evidence", desc: "Pharmacy receipts & pickups", color: "text-sky-600" },
  { key: "missingRecords", icon: AlertCircle, label: "Missing records", desc: "Gaps detected automatically", color: "text-amber-600" },
  { key: "questionsForDoctor", icon: HelpCircle, label: "Questions for doctor", desc: "Pre-visit question list", color: "text-indigo-600" },
];

type FlowStage = "collecting" | "processing" | "packet" | null;

export default function FlowPage() {
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [packet, setPacket] = useState<any>(null);
  const [activeStage, setActiveStage] = useState<FlowStage>(null);
  const [flowActive, setFlowActive] = useState(false);

  useEffect(() => {
    fetch("/api/data/counts").then(r => r.json()).then(d => {
      if (d.counts) setCounts(d.counts);
    }).finally(() => setLoading(false));
  }, []);

  const runFlow = useCallback(async () => {
    setFlowActive(true);
    setPacket(null);

    setActiveStage("collecting");
    await new Promise(r => setTimeout(r, 800));

    setActiveStage("processing");
    await new Promise(r => setTimeout(r, 800));

    setActiveStage("packet");
    setGenerating(true);
    try {
      const res = await fetch("/api/packet?patientId=pat-001&purpose=diabetes follow-up");
      const data = await res.json();
      setPacket(data);
    } catch {
      // ignore
    } finally {
      setGenerating(false);
      setFlowActive(false);
    }
  }, []);

  const totalSources = DATA_SOURCES.length;
  const populatedSources = DATA_SOURCES.filter(s => (counts[s.key] || 0) > 0).length;

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-info/20 bg-info/5 px-4 py-1.5 text-xs font-medium text-info">
            <Layers className="h-3.5 w-3.5" />
            Live Pipeline
          </div>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-ink">
            Scattered records →{" "}
            <span className="bg-gradient-to-r from-info to-teal-500 bg-clip-text text-transparent">
              structured packet
            </span>
          </h1>
          <p className="mt-2 text-sm text-muted">
            {loading ? "Loading live counts..." : `${populatedSources}/${totalSources} sources connected · ${Object.values(counts).reduce((a, b) => a + b, 0)} total records`}
          </p>
        </div>
        <button
          onClick={runFlow}
          disabled={flowActive}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-info to-teal-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-info/20 hover:shadow-xl hover:shadow-info/30 disabled:opacity-50 transition-all"
        >
          {flowActive ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
          {flowActive ? "Running pipeline..." : "Run full pipeline"}
        </button>
      </div>

      {/* Flow Pipeline */}
      <div className="grid gap-5 lg:grid-cols-[1fr_auto_1.2fr_auto_1fr] items-start">

        {/* LEFT: Scattered Records */}
        <div className="space-y-3">
          <div className="flex items-center gap-2.5 mb-4">
            <div className={`flex h-8 w-8 items-center justify-center rounded-lg transition-all duration-500 ${activeStage === "collecting" ? "bg-orange-400 shadow-lg shadow-orange-200 scale-110" : "bg-orange-100"}`}>
              <BarChart3 className={`h-4 w-4 transition-colors ${activeStage === "collecting" ? "text-white" : "text-orange-600"}`} />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-ink">Scattered Records</h2>
              <p className="text-[11px] text-muted">{loading ? "Loading..." : `${Object.values(counts).reduce((a, b) => a + b, 0)} records across ${populatedSources} sources`}</p>
            </div>
          </div>
          <div className="space-y-2.5">
            {DATA_SOURCES.map((s) => {
              const Icon = s.icon;
              const count = counts[s.key] || 0;
              return (
                <div
                  key={s.key}
                  className={`flex items-center gap-3 rounded-xl border-2 px-4 py-3 shadow-sm transition-all duration-300 hover:shadow-md cursor-pointer ${count > 0 ? s.color : "border-slate-200 bg-white text-slate-400"}`}
                  title={`${count} records`}
                >
                  <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${count > 0 ? s.iconBg : "bg-slate-100"}`}>
                    <Icon className={`h-3.5 w-3.5 ${count > 0 ? "" : "text-slate-400"}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className={`text-sm font-medium ${count > 0 ? "" : "text-slate-400"}`}>{s.label}</span>
                      {!loading && (
                        <span className={`text-xs font-mono font-semibold tabular-nums ml-2 ${count > 0 ? "opacity-80" : "text-slate-300"}`}>
                          {count}
                        </span>
                      )}
                    </div>
                    <div className="mt-1 h-1 w-full rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${count > 0 ? "bg-current opacity-40" : "bg-transparent"}`}
                        style={{ width: `${Math.min((count / 20) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ARROW 1 */}
        <div className="flex items-center justify-center self-stretch">
          <div className={`hidden lg:flex h-12 w-12 items-center justify-center rounded-full transition-all duration-500 shadow-lg ${
            activeStage === "collecting" ? "bg-gradient-to-br from-info to-teal-500 scale-125 shadow-info/30 animate-pulse" :
            activeStage === "processing" || activeStage === "packet" ? "bg-gradient-to-br from-teal-400 to-emerald-500 shadow-teal-200" :
            "bg-gradient-to-br from-info to-teal-500 shadow-info/10"
          }`}>
            <ArrowRight className={`h-5 w-5 text-white transition-all ${flowActive ? "translate-x-0.5" : ""}`} />
          </div>
          <div className="flex lg:hidden items-center justify-center py-2">
            <ChevronRight className="h-6 w-6 text-muted rotate-90" />
          </div>
        </div>

        {/* CENTER: Coral SQL Layer */}
        <div className="space-y-3">
          <div className="flex items-center gap-2.5 mb-4">
            <div className={`flex h-8 w-8 items-center justify-center rounded-lg transition-all duration-500 ${activeStage === "processing" ? "bg-info shadow-lg shadow-info/30 scale-110" : "bg-info/10"}`}>
              <Database className={`h-4 w-4 transition-colors ${activeStage === "processing" ? "text-white" : "text-info"}`} />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-ink">Coral SQL Layer</h2>
              <p className="text-[11px] text-muted">Normalize · Structure · Verify</p>
            </div>
          </div>

          <div className={`rounded-2xl border-2 p-6 shadow-xl transition-all duration-500 ${
            activeStage === "processing"
              ? "border-info/40 bg-gradient-to-br from-blue-50 via-white to-teal-50 shadow-info/10"
              : "border-info/10 bg-gradient-to-br from-blue-50/50 via-white to-teal-50/50"
          }`}>
            <div className="flex items-center gap-3 mb-5">
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-500 ${activeStage === "processing" ? "bg-info shadow-md shadow-info/30 scale-110" : "bg-info/70 shadow-sm"}`}>
                <Database className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-ink">Coral</h3>
                <p className="text-[11px] text-muted">Unified query engine</p>
              </div>
            </div>

            <div className="space-y-2.5">
              {[
                { label: `Connect ${populatedSources}/${totalSources} care sources`, done: true },
                { label: "Normalize schemas", done: true },
                { label: "Structure records", done: true },
                { label: "Verify & link data", done: true },
              ].map((item, i) => (
                <div
                  key={item.label}
                  className={`flex items-center gap-3 rounded-xl border px-4 py-3 shadow-sm transition-all duration-300 ${
                    activeStage === "processing"
                      ? "border-info/20 bg-white translate-x-1"
                      : "border-info/5 bg-white/80"
                  }`}
                  style={{ transitionDelay: `${i * 100}ms` }}
                >
                  <div className={`flex h-6 w-6 items-center justify-center rounded-full transition-all ${
                    activeStage === "processing" ? "bg-info/10 scale-110" : "bg-info/5"
                  }`}>
                    {item.done ? (
                      <CheckCircle2 className={`h-3.5 w-3.5 ${activeStage === "processing" ? "text-info" : "text-info/60"}`} />
                    ) : (
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-info" />
                    )}
                  </div>
                  <span className={`text-sm font-medium ${activeStage === "processing" ? "text-info" : "text-info/70"}`}>{item.label}</span>
                  {activeStage === "processing" && (
                    <span className="ml-auto text-[10px] text-info/50 font-mono">{i === 0 ? `${populatedSources}/${totalSources}` : "✓"}</span>
                  )}
                </div>
              ))}
            </div>

            <div className={`mt-4 rounded-xl border px-4 py-3 text-center transition-all ${
              activeStage === "processing" ? "border-info/20 bg-white/80" : "border-info/5 bg-white/60"
            }`}>
              <p className="text-[11px] font-medium text-muted">
                {totalSources} sources · 1 SQL interface · 3 query modes
              </p>
            </div>
          </div>
        </div>

        {/* ARROW 2 */}
        <div className="flex items-center justify-center self-stretch">
          <div className={`hidden lg:flex h-12 w-12 items-center justify-center rounded-full transition-all duration-500 shadow-lg ${
            activeStage === "processing" ? "bg-gradient-to-br from-teal-400 to-emerald-500 scale-125 shadow-teal-200 animate-pulse" :
            activeStage === "packet" ? "bg-gradient-to-br from-teal-400 to-emerald-500 shadow-teal-200" :
            "bg-gradient-to-br from-teal-300 to-emerald-400 shadow-teal-100"
          }`}>
            <ArrowRight className={`h-5 w-5 text-white transition-all ${flowActive ? "translate-x-0.5" : ""}`} />
          </div>
          <div className="flex lg:hidden items-center justify-center py-2">
            <ChevronRight className="h-6 w-6 text-muted rotate-90" />
          </div>
        </div>

        {/* RIGHT: Doctor-Ready Packet */}
        <div className="space-y-3">
          <div className="flex items-center gap-2.5 mb-4">
            <div className={`flex h-8 w-8 items-center justify-center rounded-lg transition-all duration-500 ${activeStage === "packet" ? "bg-emerald-400 shadow-lg shadow-emerald-200 scale-110" : "bg-emerald-100"}`}>
              <FileText className={`h-4 w-4 transition-colors ${activeStage === "packet" ? "text-white" : "text-emerald-600"}`} />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-ink">Doctor-Ready Packet</h2>
              <p className="text-[11px] text-muted">{packet ? `Generated for ${packet.patient?.name || "patient"}` : "Structured for clinic visits"}</p>
            </div>
          </div>
          <div className="space-y-2.5">
            {PACKET_SECTIONS.map((p) => {
              const Icon = p.icon;
              const packetData = packet?.[p.key];
              const hasData = Array.isArray(packetData) ? packetData.length > 0 : !!packetData;
              const count = Array.isArray(packetData) ? packetData.length : (packetData ? 1 : 0);

              return (
                <div
                  key={p.key}
                  className={`flex items-start gap-3 rounded-xl border-2 px-4 py-3 shadow-sm transition-all duration-300 hover:shadow-md cursor-pointer ${
                    hasData
                      ? "border-emerald-200 bg-gradient-to-r from-emerald-50 to-white"
                      : packet
                        ? "border-amber-200 bg-amber-50/50"
                        : "border-slate-100 bg-white"
                  } ${activeStage === "packet" && generating ? "animate-pulse" : ""}`}
                >
                  <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
                    hasData ? "bg-emerald-100" : packet ? "bg-amber-100" : "bg-slate-100"
                  }`}>
                    <Icon className={`h-3.5 w-3.5 ${hasData ? "text-emerald-600" : packet ? "text-amber-500" : "text-slate-300"}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className={`text-sm font-medium ${hasData ? "text-ink" : packet ? "text-amber-700" : "text-slate-400"}`}>
                        {p.label}
                      </span>
                      {generating && activeStage === "packet" && (
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-emerald-500 shrink-0 ml-2" />
                      )}
                      {hasData && !generating && (
                        <span className="text-xs font-mono font-semibold tabular-nums text-emerald-600 shrink-0 ml-2">{count}</span>
                      )}
                      {packet && !hasData && !generating && (
                        <XCircle className="h-3.5 w-3.5 text-amber-400 shrink-0 ml-2" />
                      )}
                    </div>
                    <p className={`text-[11px] mt-0.5 ${hasData ? "text-muted" : packet ? "text-amber-600/70" : "text-slate-300"}`}>
                      {hasData ? p.desc : packet ? "Not available in this dataset" : p.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {generating && (
            <div className="flex items-center justify-center gap-2 rounded-xl border border-info/20 bg-info/5 px-4 py-3 text-xs text-info">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Generating packet from {populatedSources} sources...
            </div>
          )}
        </div>

      </div>

      {/* Packet summary bar */}
      {packet && (
        <div className="rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-white p-5 shadow-sm">
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
