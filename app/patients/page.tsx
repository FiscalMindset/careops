import { generateDoctorVisitPacket } from "@/lib/agent/careops-agent";
import { Badge, Card, PageHeader } from "@/components/ui";
import { Pill, Beaker, Calendar, MessageSquare, Activity, User, Stethoscope } from "lucide-react";

const PATIENTS = [
  { id: "pat-001", name: "Raman Mehta", condition: "diabetes follow-up" },
  { id: "pat-002", name: "Leela Shah", condition: "hypertension review" },
  { id: "pat-003", name: "Dev Kapoor", condition: "post-discharge medication reconciliation" },
];

function SeverityBadge({ severity }: { severity: number }) {
  const color = severity >= 7 ? "bg-red-50 text-danger border-red-200" :
    severity >= 4 ? "bg-amber-50 text-warning border-amber-200" :
    "bg-blue-50 text-info border-blue-200";
  return <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${color}`}>{severity}/10</span>;
}

export default async function PatientsPage({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  const params = await searchParams;
  const patientId = params.id || "pat-001";
  const patientInfo = PATIENTS.find(p => p.id === patientId) || PATIENTS[0];
  const packet = await generateDoctorVisitPacket(patientId, patientInfo.condition);

  return (
    <div className="space-y-6">
      <PageHeader title="Patient Profile" eyebrow="Synthetic demo patient">No real patient data is used.</PageHeader>

      <Card>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted">Select patient:</span>
          {PATIENTS.map(p => (
            <a key={p.id} href={`/patients?id=${p.id}`}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                p.id === patientId ? 'bg-info text-white' : 'bg-surface text-muted hover:bg-white border border-border'
              }`}
            >
              {p.name}
            </a>
          ))}
        </div>
      </Card>

      <Card>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h3 className="text-2xl font-semibold">{packet.patient.name}</h3>
              <Badge tone="info">{packet.patient.condition_focus}</Badge>
            </div>
            <p className="mt-1 text-sm text-muted">Patient ID: {packet.patient.patient_id}</p>
            <div className="mt-2 flex flex-wrap gap-4">
              <span className="flex items-center gap-1.5 text-sm text-muted"><User className="h-3.5 w-3.5" /> {packet.patient.age}y, {packet.patient.gender}</span>
              <span className="flex items-center gap-1.5 text-sm text-muted"><Stethoscope className="h-3.5 w-3.5" /> {packet.patient.primary_doctor}</span>
            </div>
          </div>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg border border-border bg-surface p-3">
            <p className="text-xs text-muted">Current medicines</p>
            <p className="mt-1 text-xl font-semibold text-ink">{packet.currentMedicines.length}</p>
          </div>
          <div className="rounded-lg border border-border bg-surface p-3">
            <p className="text-xs text-muted">Recent labs</p>
            <p className="mt-1 text-xl font-semibold text-ink">{packet.recentLabs.length}</p>
          </div>
          <div className="rounded-lg border border-border bg-surface p-3">
            <p className="text-xs text-muted">Upcoming appointment</p>
            <p className="mt-1 text-xl font-semibold text-ink">
              {packet.upcomingAppointment?.appointment_date ?? "None"}
            </p>
          </div>
        </div>
      </Card>

      {packet.currentMedicines.length > 0 && (
        <div>
          <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold text-ink"><Pill className="h-5 w-5 text-info" /> Current Medicines</h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {packet.currentMedicines.map((med) => (
              <Card key={med.medicine_name}>
                <div className="flex items-start justify-between">
                  <h4 className="font-semibold text-ink">{med.medicine_name}</h4>
                  {med.end_date ? <Badge tone="warning">Discontinued {med.end_date}</Badge> : <Badge tone="success">Active</Badge>}
                </div>
                <p className="mt-1 text-sm text-muted">{med.dose}, {med.frequency}</p>
                <p className="mt-2 text-xs text-muted">Started {med.start_date} | Source: {med.source}</p>
                {med.notes && <p className="mt-1 text-xs text-muted italic">{med.notes}</p>}
              </Card>
            ))}
          </div>
        </div>
      )}

      {packet.recentLabs.length > 0 && (
        <div>
          <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold text-ink"><Beaker className="h-5 w-5 text-info" /> Recent Labs</h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {packet.recentLabs.map((lab, i) => (
              <Card key={i}>
                <h4 className="font-semibold text-ink">{lab.test_name}</h4>
                <p className="mt-1 text-sm">
                  <span className="font-medium text-ink">{lab.value} {lab.unit}</span>
                  <span className="text-muted"> (ref: {lab.reference_range})</span>
                </p>
                <p className="mt-1 text-xs text-muted">{lab.report_date} — {lab.lab_name}</p>
              </Card>
            ))}
          </div>
        </div>
      )}

      {packet.symptomTimeline.length > 0 && (
        <div>
          <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold text-ink"><Activity className="h-5 w-5 text-info" /> Symptom Timeline</h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {packet.symptomTimeline.map((sym, i) => (
              <Card key={i}>
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-ink">{sym.symptom}</h4>
                  <SeverityBadge severity={sym.severity} />
                </div>
                <p className="mt-1 text-xs text-muted">{sym.date}{sym.related_medicine ? ` — related: ${sym.related_medicine}` : ''}</p>
                {sym.notes && <p className="mt-1 text-xs text-muted italic">{sym.notes}</p>}
              </Card>
            ))}
          </div>
        </div>
      )}

      {packet.doctorInstructions.length > 0 && (
        <div>
          <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold text-ink"><MessageSquare className="h-5 w-5 text-info" /> Doctor Instructions</h3>
          <div className="space-y-3">
            {packet.doctorInstructions.map((inst, i) => (
              <Card key={i}>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-ink">{inst.doctor}</p>
                    <p className="mt-1 text-sm text-muted">{inst.message}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Badge tone={inst.instruction_type === 'medicine_change' ? 'warning' : 'info'}>{inst.instruction_type}</Badge>
                    <span className="text-xs text-muted">{inst.date}</span>
                  </div>
                </div>
                {inst.followup_date && <p className="mt-2 text-xs text-muted">Follow-up: {inst.followup_date}</p>}
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
