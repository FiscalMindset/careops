import { Badge, Card, PageHeader, SafetyNotice } from "@/components/ui";

export default function AboutPage() {
  return (
    <div className="space-y-6 max-w-4xl">
      <PageHeader title="About CareOps Agent" eyebrow="Coral Hackathon Track 2">
        A Coral-powered family care coordination first mate that turns scattered care records into one clean doctor-ready packet.
      </PageHeader>

      <SafetyNotice />

      <Card>
        <h3 className="text-lg font-semibold">How to Use CareOps</h3>
        <ol className="mt-4 space-y-3 text-sm leading-6 text-muted list-decimal pl-5">
          <li><strong className="text-ink">Open the Dashboard</strong> — See patient stats, connected data sources, and a natural language query input.</li>
          <li><strong className="text-ink">Ask a question</strong> — Type something like &ldquo;Prepare a doctor visit packet for Raman Mehta&rdquo; in the query box and click Ask.</li>
          <li><strong className="text-ink">Browse data sources</strong> — Visit the Data Sources page to see all 9 connected care record types.</li>
          <li><strong className="text-ink">View patient profile</strong> — The Patient page shows demographics, current medicines, and upcoming appointments.</li>
          <li><strong className="text-ink">Explore the timeline</strong> — The Timeline page displays a cross-source chronology of all events (medications, labs, symptoms, chats, refills).</li>
          <li><strong className="text-ink">Generate a packet</strong> — The Packet page shows the auto-generated doctor visit packet with medicines, labs, symptoms, missing records, and questions for the doctor.</li>
          <li><strong className="text-ink">Review SQL evidence</strong> — The Evidence page displays the exact Coral SQL query used to join all sources and the resulting data.</li>
          <li><strong className="text-ink">Export</strong> — Click &ldquo;Export markdown&rdquo; on the Packet page to download a printable doctor-ready document.</li>
        </ol>
      </Card>

      <Card>
        <h3 className="text-lg font-semibold">What It Does</h3>
        <p className="mt-2 text-sm leading-6 text-muted">
          CareOps Agent helps families prepare for doctor visits by joining records from 9 sources — medications, lab reports, doctor chat instructions, pharmacy receipts, symptom logs, appointments, prescription OCR scans, and family notes — into a single organized packet.
        </p>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {[
            ["Current medicines", "Lists all active prescriptions with dosages and schedules"],
            ["Recent lab results", "Shows latest HbA1c, fasting glucose, and other test values"],
            ["Medicine change timeline", "Tracks when medicines were added or changed"],
            ["Symptom tracking", "Logs symptoms recorded after medicine changes"],
            ["Refill evidence", "Pharmacy receipts confirming prescription fills"],
            ["Missing record detection", "Flags BP, weight, or other records not found"],
            ["Doctor questions", "Auto-generates questions to ask at the visit"],
            ["SQL evidence panel", "Shows the exact query and joined data backing every result"]
          ].map(([title, desc]) => (
            <div key={title} className="rounded-md border border-border p-3">
              <h4 className="font-medium text-sm text-ink">{title}</h4>
              <p className="mt-1 text-xs text-muted">{desc}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <h3 className="text-lg font-semibold">Tech Stack</h3>
        <div className="mt-3 flex flex-wrap gap-2">
          {["Next.js 15", "TypeScript", "Tailwind CSS", "Lucide Icons", "SQLite", "Zod", "Vitest", "Coral MCP"].map((tech) => (
            <Badge key={tech} tone="info">{tech}</Badge>
          ))}
        </div>
        <div className="mt-4 text-sm leading-6 text-muted space-y-2">
          <p><strong className="text-ink">Architecture:</strong> Next.js App Router with server components. Data flows: CSV → SQLite → CoralClient abstraction → Agent module → UI/Export.</p>
          <p><strong className="text-ink">Coral Integration:</strong> CareOps defines 9 custom Coral source specs. The CoralClient abstraction layer supports both local SQLite (development mode) and real Coral MCP (production) transparently.</p>
          <p><strong className="text-ink">Safety:</strong> Deterministic packet generation. No LLM required. No diagnosis or prescription. All LLM keys are optional.</p>
        </div>
      </Card>

      <Card>
        <h3 className="text-lg font-semibold">About Coral</h3>
        <p className="mt-2 text-sm leading-6 text-muted">
          Coral is an open-source Model Context Protocol (MCP) server that provides a SQL-based abstraction layer over disparate data sources. CareOps uses Coral as its central query layer because answering care coordination questions requires joining data from 9 silos.
        </p>
        <p className="mt-2 text-sm leading-6 text-muted">
          <strong>Coral repo:</strong> <a href="https://github.com/withcoral/coral" className="text-info underline">github.com/withcoral/coral</a>
        </p>
        <p className="mt-2 text-sm leading-6 text-muted">
          In development mode, CareOps uses an embedded SQLite engine that mirrors the Coral spec architecture. To switch to real Coral MCP, set <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs">NEXT_PUBLIC_USE_MOCK_CORAL=false</code> and configure your Coral MCP server URL.
        </p>
      </Card>

      <Card>
        <div className="flex items-center gap-4">
          <img src="https://github.com/FiscalMindset.png" width={64} height={64} className="rounded-full" alt="" />
          <div>
            <h3 className="font-semibold text-ink">FiscalMindset</h3>
            <p className="text-sm text-info font-medium">Open-source builder exploring Coral-powered personal agents</p>
            <p className="mt-1 text-sm text-muted">
              I build practical AI systems, source specs, and agent workflows that turn scattered data into useful products. This project was built for the Coral Hackathon Track 2.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
