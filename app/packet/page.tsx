import { generateDoctorVisitPacket } from "@/lib/agent/careops-agent";
import { Badge, Card, ExportButton, MissingRecordAlert, PageHeader, SafetyNotice } from "@/components/ui";

export default async function PacketPage() {
  const packet = await generateDoctorVisitPacket("pat-001", "diabetes follow-up");
  return (
    <div className="space-y-6">
      <PageHeader title="Doctor Visit Packet Builder" eyebrow="Generated packet">Demo request: Prepare a doctor visit packet for my father's diabetes follow-up.</PageHeader>
      <div className="flex flex-wrap items-center gap-3"><ExportButton /><Badge tone="success">Generated from {packet.sourcesUsed.length} sources</Badge></div>
      <SafetyNotice />
      <Card>
        <h3 className="text-xl font-semibold">One-page doctor-ready packet</h3>
        <p className="mt-2 text-sm leading-6 text-muted">{packet.summary}</p>
      </Card>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card><h3 className="font-semibold">Current medicines</h3><ul className="mt-3 space-y-2 text-sm">{packet.currentMedicines.map((m) => <li key={m.medicine_name}>- {m.medicine_name} {m.dose}, {m.frequency}</li>)}</ul></Card>
        <Card><h3 className="font-semibold">Recent labs</h3><ul className="mt-3 space-y-2 text-sm">{packet.recentLabs.map((l) => <li key={`${l.test_name}-${l.report_date}`}>- {l.report_date}: {l.test_name} {l.value}{l.unit}</li>)}</ul></Card>
        <Card><h3 className="font-semibold">Doctor instructions</h3><ul className="mt-3 space-y-2 text-sm">{packet.doctorInstructions.map((d) => <li key={`${d.date}-${d.instruction_type}`}>- {d.date}: {d.message}</li>)}</ul></Card>
        <Card><h3 className="font-semibold">Refill status</h3><ul className="mt-3 space-y-2 text-sm">{packet.refillEvidence.map((r) => <li key={`${r.medicine}-${r.date}`}>- {r.date}: {r.medicine}, {r.quantity}</li>)}</ul></Card>
      </div>
      <MissingRecordAlert records={packet.missingRecords} />
      <Card>
        <h3 className="font-semibold">Questions to ask doctor</h3>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-6">
          {packet.questions.map((question) => <li key={question}>{question}</li>)}
        </ol>
      </Card>
    </div>
  );
}
