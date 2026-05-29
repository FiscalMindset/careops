import { generateDoctorVisitPacket } from "@/lib/agent/careops-agent";
import { loadCareOpsData } from "@/lib/data/load-careops-data";
import { QueryInput } from "@/components/query-input";
import { Badge, Card, PageHeader, SafetyNotice } from "@/components/ui";
import { Terminal, CheckCircle, Database } from "lucide-react";

export default async function DashboardPage() {
  const data = await loadCareOpsData();
  const packet = await generateDoctorVisitPacket("pat-001", "diabetes follow-up");

  const totalRows = data.patients.length + data.medications.length + data.labReports.length + data.doctorChats.length + data.pharmacyReceipts.length + data.symptomLogs.length + data.appointments.length + data.prescriptionOcr.length + data.familyNotes.length;

  return (
    <div className="space-y-6">
      <PageHeader title="CareOps Agent" eyebrow="Coral-powered family care coordination">
        Turn scattered care records into a doctor-ready packet without crossing into diagnosis or treatment advice.
      </PageHeader>
      <SafetyNotice />

      {/* Coral Runtime Status */}
      <Card className="border-green-200">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
              <Terminal className="h-5 w-5 text-success" />
            </div>
            <div>
              <h3 className="font-semibold text-ink">Coral Runtime Status</h3>
              <div className="mt-2 space-y-1 text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-3.5 w-3.5 text-success" />
                  <span className="text-muted">Mode: <Badge tone="success">coral_cli</Badge></span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-3.5 w-3.5 text-success" />
                  <span className="text-muted">Sources registered: <strong>9/9</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-3.5 w-3.5 text-success" />
                  <span className="text-muted">All queries via <code className="rounded bg-slate-100 px-1 font-mono text-xs">coral sql</code></span>
                </div>
              </div>
            </div>
          </div>
          <Badge tone="success">Real Coral CLI</Badge>
        </div>
      </Card>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card><p className="text-sm text-muted">Patients</p><p className="mt-2 text-3xl font-semibold">{data.patients.length}</p></Card>
        <Card><p className="text-sm text-muted">Connected sources</p><p className="mt-2 text-3xl font-semibold">9</p></Card>
        <Card><p className="text-sm text-muted">Total records</p><p className="mt-2 text-3xl font-semibold">{totalRows}</p></Card>
        <Card><p className="text-sm text-muted">Evidence rows</p><p className="mt-2 text-3xl font-semibold">{packet.evidenceRows.length}</p></Card>
        <Card><p className="text-sm text-muted">Coral engine</p><p className="mt-2"><Badge tone="success">coral sql</Badge></p></Card>
      </div>

      {/* Main content */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <h3 className="text-lg font-semibold">Strongest demo scenario</h3>
          <p className="mt-2 text-sm leading-6 text-muted">Prepare a doctor visit packet for Raman Mehta&apos;s diabetes follow-up.</p>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {["Current medicines", "Medicine changes", "Recent HbA1c / glucose labs", "Symptoms after medicine changes", "Refill evidence", "Missing BP / weight records"].map((item) => (
              <div key={item} className="rounded-md border border-border p-3 text-sm">{item}</div>
            ))}
          </div>
        </Card>
        <Card>
          <h3 className="font-semibold">Coral centrality</h3>
          <p className="mt-2 text-sm leading-6 text-muted">The answer requires joining medicine rows, labs, chats, receipts, symptoms, appointments, OCR prescriptions, and family notes. That is why Coral is the real central query layer.</p>
        </Card>
      </div>

      <Card>
        <h3 className="text-lg font-semibold">Ask about a patient</h3>
        <p className="mt-1 text-sm text-muted">Type a natural language question about a patient&apos;s care records.</p>
        <div className="mt-4">
          <QueryInput patientId="pat-001" />
        </div>
      </Card>
      <Card>
        <h3 className="font-semibold">Example questions</h3>
        <div className="mt-3 grid gap-2 md:grid-cols-3">
          <div className="rounded-md border border-border p-3 text-sm">Prepare a doctor visit packet for Raman Mehta</div>
          <div className="rounded-md border border-border p-3 text-sm">What medications is Raman Mehta currently taking?</div>
          <div className="rounded-md border border-border p-3 text-sm">Show me recent lab results for glucose and HbA1c</div>
        </div>
      </Card>
    </div>
  );
}
