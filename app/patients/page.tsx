import { generateDoctorVisitPacket } from "@/lib/agent/careops-agent";
import { Badge, Card, PageHeader } from "@/components/ui";

export default async function PatientsPage() {
  const packet = await generateDoctorVisitPacket("pat-001", "diabetes follow-up");
  return (
    <div className="space-y-6">
      <PageHeader title="Patient Profile" eyebrow="Synthetic demo patient">No real patient data is used.</PageHeader>
      <Card>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h3 className="text-2xl font-semibold">{packet.patient.name}</h3>
            <p className="mt-1 text-sm text-muted">Patient ID: {packet.patient.patient_id}</p>
            <p className="mt-1 text-sm text-muted">Age: {packet.patient.age} | Gender: {packet.patient.gender}</p>
          </div>
          <Badge tone="info">{packet.patient.condition_focus}</Badge>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div><p className="text-sm text-muted">Primary doctor</p><p className="font-medium">{packet.patient.primary_doctor}</p></div>
          <div><p className="text-sm text-muted">Current medicines</p><p className="font-medium">{packet.currentMedicines.length}</p></div>
          <div><p className="text-sm text-muted">Upcoming appointment</p><p className="font-medium">{packet.upcomingAppointment?.appointment_date ?? "None"}</p></div>
        </div>
      </Card>
      <div className="grid gap-4 md:grid-cols-3">
        {packet.currentMedicines.map((med) => (
          <Card key={med.medicine_name}>
            <h3 className="font-semibold">{med.medicine_name}</h3>
            <p className="mt-1 text-sm text-muted">{med.dose}, {med.frequency}</p>
            <p className="mt-2 text-xs text-muted">Started {med.start_date} | Source: {med.source}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
