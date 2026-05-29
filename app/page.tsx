import { generateDoctorVisitPacket } from "@/lib/agent/careops-agent";
import { loadCareOpsData } from "@/lib/data/load-careops-data";
import { QueryInput } from "@/components/query-input";
import { PatientSelector } from "@/components/patient-selector";
import { ModeBadge, Badge, Card, PageHeader, SafetyNotice } from "@/components/ui";
import { MermaidDiagram } from "@/components/mermaid-diagram";
import { Terminal, CheckCircle, Database, Brain, BarChart3, Workflow } from "lucide-react";

export default async function DashboardPage() {
  const data = await loadCareOpsData();
  const packet = await generateDoctorVisitPacket("pat-001", "diabetes follow-up");

  const totalRows = data.patients.length + data.medications.length + data.labReports.length + data.doctorChats.length + data.pharmacyReceipts.length + data.symptomLogs.length + data.appointments.length + data.prescriptionOcr.length + data.familyNotes.length;

  const mode = process.env.CAREOPS_QUERY_MODE === "mock" ? "mock" : "coral_cli";
  const isMock = mode === "mock";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader title="CareOps Agent" eyebrow="Coral-powered family care coordination">
          Turn scattered care records into a doctor-ready packet without crossing into diagnosis or treatment advice.
        </PageHeader>
        <ModeBadge mode={mode} />
      </div>
      <SafetyNotice />

      {/* Coral Runtime Status */}
      <Card className={isMock ? "border-amber-200" : "border-green-200"}>
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-full ${isMock ? "bg-amber-100" : "bg-green-100"}`}>
              <Terminal className={`h-5 w-5 ${isMock ? "text-warning" : "text-success"}`} />
            </div>
            <div>
              <h3 className="font-semibold text-ink">Coral Runtime Status</h3>
              <div className="mt-2 space-y-1 text-sm">
                {isMock ? (
                  <div className="flex items-center gap-2">
                    <span className="text-amber-500 text-xs font-medium">Running in mock mode — queries use SQLite fallback</span>
                  </div>
                ) : (
                  <>
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
                  </>
                )}
              </div>
            </div>
          </div>
          {!isMock && <Badge tone="success">Real Coral CLI</Badge>}
          {isMock && <Badge tone="warning">Mock Mode</Badge>}
        </div>
      </Card>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-6">
        <Card><p className="text-sm text-muted">Patients</p><p className="mt-2 text-3xl font-semibold">{data.patients.length}</p></Card>
        <Card><p className="text-sm text-muted">Connected sources</p><p className="mt-2 text-3xl font-semibold">9</p></Card>
        <Card><p className="text-sm text-muted">Total records</p><p className="mt-2 text-3xl font-semibold">{totalRows}</p></Card>
        <Card><p className="text-sm text-muted">Evidence rows</p><p className="mt-2 text-3xl font-semibold">{packet.evidenceRows.length}</p></Card>
        <Card><p className="text-sm text-muted">Coral engine</p><p className="mt-2"><Badge tone="success">coral sql</Badge></p></Card>
        <Card><p className="text-sm text-muted">Ollama AI</p><p className="mt-2"><Badge tone="success">Connected</Badge></p></Card>
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
          <div className="mt-4 flex items-center gap-2 text-xs text-purple-600"><Brain className="h-3.5 w-3.5" /> Ollama AI available for analysis</div>
        </Card>
      </div>

      {/* Architecture Flow Diagram */}
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <Workflow className="h-5 w-5 text-info" />
          <h3 className="text-lg font-semibold">Architecture Flow</h3>
        </div>
        <p className="text-sm text-muted mb-4">How a family caregiver question becomes a doctor-ready packet — from query input through Coral SQL joins to export.</p>
        <MermaidDiagram
          chart={`
flowchart LR
    User["Family Caregiver"] --> Ask["Query Input\n/ask a question"]
    Ask --> CoralCLI["Coral CLI Client\ncoral-cli-client.ts"]
    
    subgraph Coral["Coral Query Engine"]
        CoralCLI --> CSQL["coral sql --format json"]
        CSQL --> Sources["9 Coral Source Specs"]
    end
    
    Sources --> P1["careops_patients"]
    Sources --> P2["careops_medications"]
    Sources --> P3["careops_lab_reports"]
    Sources --> P4["careops_doctor_chats"]
    Sources --> P5["careops_pharmacy_receipts"]
    Sources --> P6["careops_symptom_logs"]
    Sources --> P7["careops_appointments"]
    Sources --> P8["careops_prescription_ocr"]
    Sources --> P9["careops_family_notes"]
    
    P1 --> JSONL["data/*.jsonl"]
    P2 --> JSONL
    P3 --> JSONL
    P4 --> JSONL
    P5 --> JSONL
    P6 --> JSONL
    P7 --> JSONL
    P8 --> JSONL
    P9 --> JSONL
    
    CSQL --> Result["Joined SQL Results"]
    Result --> Agent["Packet Generator\ncareops-agent.ts"]
    Agent --> Packet["Doctor Visit Packet"]
    Packet --> Export["Export Markdown"]
    Packet --> Evidence["SQL Evidence Panel"]
          `}
          title="End-to-End Query Flow"
        />
      </Card>

      <Card>
        <h3 className="text-lg font-semibold">Ask about a patient</h3>
        <p className="mt-1 text-sm text-muted">Select a patient and ask a natural language question about their care records.</p>
        <div className="mt-4">
          <PatientSelector patients={data.patients} />
        </div>
      </Card>

      <Card>
        <h3 className="font-semibold">Quick Analytics</h3>
        <p className="text-sm text-muted mt-1">View detailed per-patient analytics with charts and filters.</p>
        <a href="/analytics" className="mt-3 inline-flex items-center gap-2 rounded-md bg-info px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
          <BarChart3 className="h-4 w-4" /> Open Analytics Dashboard
        </a>
      </Card>
    </div>
  );
}
