import type { Metadata } from "next";
import { FileImage, FlaskRound, MessageSquare, Receipt, Activity, Calendar, Users, Heart, Database, ArrowRight, Pill, Stethoscope, AlertCircle, HelpCircle, ChevronRight, ShieldAlert, Layers, Columns3 } from "lucide-react";

export const metadata: Metadata = {
  title: "How CareOps Works — CareOps Agent",
};

const iconClass = "h-5 w-5 shrink-0";

const scatteredRecords = [
  { icon: FileImage, label: "Prescription photos", color: "text-cyan-600 bg-cyan-50 border-cyan-200" },
  { icon: FlaskRound, label: "Lab reports", color: "text-blue-600 bg-blue-50 border-blue-200" },
  { icon: MessageSquare, label: "Doctor chats", color: "text-teal-600 bg-teal-50 border-teal-200" },
  { icon: Receipt, label: "Pharmacy receipts", color: "text-sky-600 bg-sky-50 border-sky-200" },
  { icon: Activity, label: "Symptom notes", color: "text-emerald-600 bg-emerald-50 border-emerald-200" },
  { icon: Calendar, label: "Appointments", color: "text-indigo-600 bg-indigo-50 border-indigo-200" },
  { icon: Users, label: "Family notes", color: "text-violet-600 bg-violet-50 border-violet-200" },
  { icon: Heart, label: "Vitals & device data", color: "text-rose-600 bg-rose-50 border-rose-200" },
];

const coralActions = [
  "Connects 9 care sources",
  "Normalizes schemas",
  "Structures records",
  "Verifies & links data",
];

const packetOutputs = [
  { icon: Pill, label: "Current medicines", desc: "Active prescriptions with dosages" },
  { icon: Stethoscope, label: "Recent labs", desc: "Latest test results & trends" },
  { icon: Activity, label: "Symptom timeline", desc: "Symptoms mapped to dates & meds" },
  { icon: MessageSquare, label: "Doctor instructions", desc: "Care instructions from visits" },
  { icon: Receipt, label: "Refill evidence", desc: "Pharmacy receipts & pickups" },
  { icon: AlertCircle, label: "Missing records", desc: "Gaps detected automatically" },
  { icon: HelpCircle, label: "Questions for doctor", desc: "Pre-visit question list" },
];

export default function FlowPage() {
  return (
    <div className="space-y-8">

      {/* Hero header */}
      <div className="text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-info/20 bg-info/5 px-4 py-1.5 text-xs font-medium text-info">
          <Layers className="h-3.5 w-3.5" />
          How CareOps Works
        </div>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-ink">
          Scattered records →{" "}
          <span className="bg-gradient-to-r from-info to-teal-500 bg-clip-text text-transparent">
            structured packet
          </span>
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-muted">
          CareOps connects your family&apos;s care records through a Coral SQL layer and prepares a
          doctor-ready visit packet — no diagnosis, no prescriptions, just organization.
        </p>
      </div>

      {/* Flow diagram */}
      <div className="grid gap-6 lg:grid-cols-[1fr_auto_1.2fr_auto_1fr] items-start">

        {/* LEFT: Scattered Records */}
        <div className="space-y-4">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-100">
              <Columns3 className="h-4 w-4 text-orange-600" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-ink">Scattered Records</h2>
              <p className="text-[11px] text-muted">Raw data from daily care</p>
            </div>
          </div>
          <div className="space-y-2.5">
            {scatteredRecords.map((r) => {
              const Icon = r.icon;
              return (
                <div key={r.label} className={`flex items-center gap-3 rounded-xl border px-4 py-3 shadow-sm ${r.color}`}>
                  <Icon className={iconClass} />
                  <span className="text-sm font-medium">{r.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* ARROW 1 */}
        <div className="hidden lg:flex items-center justify-center self-stretch">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-info to-teal-500 shadow-lg shadow-info/20">
            <ArrowRight className="h-5 w-5 text-white" />
          </div>
        </div>
        <div className="flex lg:hidden items-center justify-center">
          <ChevronRight className="h-6 w-6 text-muted rotate-90" />
        </div>

        {/* CENTER: Coral SQL Layer */}
        <div className="space-y-4">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-info/10">
              <Database className="h-4 w-4 text-info" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-ink">Coral SQL Layer</h2>
              <p className="text-[11px] text-muted">Normalize · Structure · Verify</p>
            </div>
          </div>

          <div className="rounded-2xl border-2 border-info/20 bg-gradient-to-br from-blue-50 via-white to-teal-50 p-6 shadow-xl shadow-info/5">
            <div className="flex items-center gap-3 mb-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-info shadow-sm">
                <Database className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-ink">Coral</h3>
                <p className="text-[11px] text-muted">Unified query engine</p>
              </div>
            </div>

            <div className="space-y-2.5">
              {coralActions.map((action) => (
                <div key={action} className="flex items-center gap-3 rounded-xl border border-info/10 bg-white/80 px-4 py-3 shadow-sm backdrop-blur-sm">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-info/10">
                    <ChevronRight className="h-3.5 w-3.5 text-info" />
                  </div>
                  <span className="text-sm font-medium text-info">{action}</span>
                </div>
              ))}
            </div>

            <div className="mt-4 rounded-xl border border-info/10 bg-white/60 px-4 py-3 text-center">
              <p className="text-[11px] font-medium text-muted">
                9 sources · 1 SQL interface · 3 query modes
              </p>
            </div>
          </div>
        </div>

        {/* ARROW 2 */}
        <div className="hidden lg:flex items-center justify-center self-stretch">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-teal-400 to-emerald-500 shadow-lg shadow-teal-200">
            <ArrowRight className="h-5 w-5 text-white" />
          </div>
        </div>
        <div className="flex lg:hidden items-center justify-center">
          <ChevronRight className="h-6 w-6 text-muted rotate-90" />
        </div>

        {/* RIGHT: Doctor-Ready Packet */}
        <div className="space-y-4">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100">
              <ClipboardListIcon className="h-4 w-4 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-ink">Doctor-Ready Packet</h2>
              <p className="text-[11px] text-muted">Structured for clinic visits</p>
            </div>
          </div>
          <div className="space-y-2.5">
            {packetOutputs.map((p) => {
              const Icon = p.icon;
              return (
                <div key={p.label} className="flex items-start gap-3 rounded-xl border border-emerald-100 bg-gradient-to-r from-emerald-50 to-white px-4 py-3 shadow-sm">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-100">
                    <Icon className="h-3.5 w-3.5 text-emerald-600" />
                  </div>
                  <div>
                    <span className="text-sm font-medium text-ink">{p.label}</span>
                    <p className="text-[11px] text-muted">{p.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* Bottom safety line */}
      <div className="flex items-center justify-center gap-3 rounded-2xl border border-amber-200 bg-amber-50/80 px-6 py-4 shadow-sm">
        <ShieldAlert className="h-5 w-5 shrink-0 text-amber-500" />
        <p className="text-sm font-medium text-amber-700">
          Not diagnosis. Not prescriptions. Record organization for doctor visits.
        </p>
      </div>

    </div>
  );
}

function ClipboardListIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
      <line x1="8" y1="9" x2="16" y2="9"/>
      <line x1="8" y1="13" x2="16" y2="13"/>
      <line x1="8" y1="17" x2="12" y2="17"/>
    </svg>
  );
}
