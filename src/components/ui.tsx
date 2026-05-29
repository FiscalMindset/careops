import type { TimelineEvent } from "@/types/careops";
import { AlertTriangle, CheckCircle2, Download, FileSearch, ShieldCheck } from "lucide-react";

export function PageHeader({ title, eyebrow, children }: { title: string; eyebrow?: string; children?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-2">
      {eyebrow ? <p className="text-sm font-semibold uppercase tracking-wide text-info">{eyebrow}</p> : null}
      <h2 className="text-3xl font-semibold tracking-tight text-ink">{title}</h2>
      {children ? <p className="max-w-3xl text-sm leading-6 text-muted">{children}</p> : null}
    </div>
  );
}

export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <section className={`rounded-lg border border-border bg-white p-5 shadow-panel ${className}`}>{children}</section>;
}

export function Badge({ children, tone = "info" }: { children: React.ReactNode; tone?: "info" | "success" | "warning" | "danger" | "neutral" }) {
  const styles = {
    info: "bg-blue-50 text-info border-blue-200",
    success: "bg-green-50 text-success border-green-200",
    warning: "bg-amber-50 text-warning border-amber-200",
    danger: "bg-red-50 text-danger border-red-200",
    neutral: "bg-slate-50 text-slate-700 border-slate-200"
  };
  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${styles[tone]}`}>{children}</span>;
}

export function SafetyNotice() {
  return (
    <Card className="border-amber-200 bg-amber-50">
      <div className="flex gap-3">
        <ShieldCheck className="mt-0.5 h-5 w-5 text-warning" />
        <div>
          <h3 className="font-semibold text-ink">Safety boundary</h3>
          <p className="mt-1 text-sm leading-6 text-slate-700">
            CareOps does not diagnose, prescribe medicine, or recommend medicine changes. It only organizes records and prepares questions for a licensed doctor.
          </p>
        </div>
      </div>
    </Card>
  );
}

export function SourceStatusCard({ name, rows, status }: { name: string; rows: number; status: string }) {
  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-ink">{name}</h3>
          <p className="mt-1 text-sm text-muted">{rows} synthetic rows</p>
        </div>
        <Badge tone="success">{status}</Badge>
      </div>
    </Card>
  );
}

export function TimelineEventCard({ event }: { event: TimelineEvent }) {
  const tone = event.confidence === "high" ? "success" : event.confidence === "medium" ? "info" : "warning";
  return (
    <div className="relative border-l border-border pb-5 pl-5">
      <div className="absolute -left-2 top-1 h-4 w-4 rounded-full border-2 border-white bg-info" />
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-semibold text-ink">{event.date}</span>
        <Badge tone={tone}>{event.type.replaceAll("_", " ")}</Badge>
        <Badge tone="neutral">{event.confidence}</Badge>
      </div>
      <h3 className="mt-2 font-semibold text-ink">{event.title}</h3>
      <p className="mt-1 text-sm leading-6 text-muted">{event.detail}</p>
      <p className="mt-1 text-xs text-muted">Source: {event.source}</p>
    </div>
  );
}

export function MissingRecordAlert({ records }: { records: string[] }) {
  if (!records.length) {
    return (
      <Card className="border-green-200 bg-green-50">
        <div className="flex gap-3 text-success"><CheckCircle2 className="h-5 w-5" /><p className="text-sm font-medium">No missing records detected by current rules.</p></div>
      </Card>
    );
  }
  return (
    <Card className="border-amber-200 bg-amber-50">
      <div className="flex gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 text-warning" />
        <div>
          <h3 className="font-semibold text-ink">Missing records</h3>
          <ul className="mt-2 space-y-1 text-sm text-slate-700">
            {records.map((record) => <li key={record}>- {record}</li>)}
          </ul>
        </div>
      </div>
    </Card>
  );
}

export function SQLQueryBlock({ sql }: { sql: string }) {
  return (
    <div className="rounded-lg border border-slate-700 bg-slate-950 p-5 shadow-panel">
      <div className="mb-3 flex items-center gap-2 text-sm font-medium text-blue-300"><FileSearch className="h-4 w-4" /> Coral SQL query</div>
      <pre className="text-xs leading-5 text-slate-200">{sql}</pre>
    </div>
  );
}

export function ExportButton({ href = "/api/export?patientId=pat-001&purpose=diabetes%20follow-up" }: { href?: string }) {
  return (
    <a className="inline-flex items-center gap-2 rounded-md bg-ink px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800" href={href}>
      <Download className="h-4 w-4" />
      Export markdown
    </a>
  );
}
