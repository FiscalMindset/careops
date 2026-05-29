import { generateDoctorVisitPacket } from "@/lib/agent/careops-agent";
import { loadCareOpsData } from "@/lib/data/load-careops-data";
import { Badge, Card, PageHeader, SafetyNotice } from "@/components/ui";

export default async function DashboardPage() {
  const data = await loadCareOpsData();
  const packet = await generateDoctorVisitPacket("pat-001", "diabetes follow-up");

  return (
    <div className="space-y-6">
      <PageHeader title="CareOps Agent" eyebrow="Coral-powered family care coordination">
        Turn scattered synthetic care records into a doctor-ready packet without crossing into diagnosis or treatment advice.
      </PageHeader>
      <SafetyNotice />
      <div className="grid gap-4 md:grid-cols-4">
        <Card><p className="text-sm text-muted">Patients</p><p className="mt-2 text-3xl font-semibold">{data.patients.length}</p></Card>
        <Card><p className="text-sm text-muted">Connected sources</p><p className="mt-2 text-3xl font-semibold">9</p></Card>
        <Card><p className="text-sm text-muted">Evidence rows</p><p className="mt-2 text-3xl font-semibold">{packet.evidenceRows.length}</p></Card>
        <Card><p className="text-sm text-muted">Mock Coral</p><p className="mt-2"><Badge tone="success">ready</Badge></p></Card>
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <h3 className="text-lg font-semibold">Strongest demo scenario</h3>
          <p className="mt-2 text-sm leading-6 text-muted">Prepare a doctor visit packet for Raman Mehta's diabetes follow-up.</p>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {["Current medicines", "Medicine changes", "Recent HbA1c / glucose labs", "Symptoms after medicine changes", "Refill evidence", "Missing BP / weight records"].map((item) => (
              <div key={item} className="rounded-md border border-border p-3 text-sm">{item}</div>
            ))}
          </div>
        </Card>
        <Card>
          <h3 className="font-semibold">Coral centrality</h3>
          <p className="mt-2 text-sm leading-6 text-muted">The answer requires joining medicine rows, labs, chats, receipts, symptoms, appointments, OCR prescriptions, and family notes. That is why Coral is the central query layer.</p>
        </Card>
      </div>
    </div>
  );
}
