import { generateDoctorVisitPacket } from "@/lib/agent/careops-agent";
import { Badge, Card, PageHeader, SQLQueryBlock } from "@/components/ui";

export default async function EvidencePage() {
  const packet = await generateDoctorVisitPacket("pat-001", "diabetes follow-up");
  return (
    <div className="space-y-6">
      <PageHeader title="Coral SQL Evidence" eyebrow="Transparent joined evidence">Coral is central because this answer requires joining multiple sources.</PageHeader>
      <SQLQueryBlock sql={packet.sql} />
      <Card>
        <h3 className="font-semibold">Sources used</h3>
        <div className="mt-3 flex flex-wrap gap-2">{packet.sourcesUsed.map((source) => <Badge key={source} tone="info">{source}</Badge>)}</div>
      </Card>
      <Card className="overflow-x-auto">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="border-b border-border text-xs uppercase text-muted">
            <tr><th className="py-2">Medicine</th><th>Symptom</th><th>Lab</th><th>Instruction</th><th>Refill</th><th>Confidence</th></tr>
          </thead>
          <tbody>
            {packet.evidenceRows.slice(0, 12).map((row, index) => (
              <tr key={`${row.medicine_name}-${index}`} className="border-b border-border/70">
                <td className="py-3">{row.medicine_name} {row.dose}</td>
                <td>{row.symptom ? `${row.symptom} (${row.symptom_date})` : "None joined"}</td>
                <td>{row.test_name ? `${row.test_name} ${row.value}${row.unit}` : "None joined"}</td>
                <td className="max-w-sm">{row.doctor_instruction ?? "None joined"}</td>
                <td>{row.refill_quantity ? `${row.refill_quantity} (${row.refill_date})` : "None joined"}</td>
                <td><Badge tone={row.confidence === "high" ? "success" : "info"}>{row.confidence}</Badge></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
