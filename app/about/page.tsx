"use client";

import { useState } from "react";
import { Badge, Card, PageHeader, SafetyNotice } from "@/components/ui";
import { MermaidDiagram } from "@/components/mermaid-diagram";
import { ChevronDown, ChevronRight, ExternalLink, Github, BookOpen, Shield, Database, Cpu, FileJson, Stethoscope } from "lucide-react";

const tabs = [
  { id: "overview", label: "Overview", icon: BookOpen },
  { id: "how-to", label: "How to Use", icon: Stethoscope },
  { id: "tech-stack", label: "Tech Stack", icon: Cpu },
  { id: "coral", label: "About Coral", icon: Database },
];

const techItems = [
  {
    name: "Next.js 15",
    category: "Framework",
    icon: FileJson,
    detail: "App Router with server components. Pages are server-rendered by default with client islands for interactivity. API routes handle all Coral CLI orchestration.",
  },
  {
    name: "TypeScript",
    category: "Language",
    icon: FileJson,
    detail: "Strict mode across the entire codebase. Zod schemas validate API inputs. All Coral queries are typed template functions.",
  },
  {
    name: "Tailwind CSS",
    category: "Styling",
    icon: FileJson,
    detail: "Utility-first CSS with a custom theme (ink, muted, info, success, warning, danger colors). No component library — all UI built from primitives.",
  },
  {
    name: "Coral CLI v0.2.0",
    category: "Query Engine",
    icon: Database,
    detail: "The central query layer. Executes SQL against 9 registered JSONL-backed source specs via `coral sql --format json`. Replaces what would require 9 different API clients.",
  },
  {
    name: "SQLite (better-sqlite3)",
    category: "Fallback",
    icon: Database,
    detail: "Used only for test/fallback mode. Mirrors the Coral spec architecture. Requires `npm run seed` to populate from CSV files.",
  },
  {
    name: "Lucide React",
    category: "Icons",
    icon: FileJson,
    detail: "Consistent icon set across all pages. Lightweight, tree-shakeable SVG icons.",
  },
  {
    name: "Zod",
    category: "Validation",
    icon: Shield,
    detail: "Schema validation for all API request/response types. Ensures type safety across the Coral CLI boundary.",
  },
  {
    name: "Vitest",
    category: "Testing",
    icon: FileJson,
    detail: "22 tests total: 13 for data loading, query builders, packet generation, and safety rules; 9 for Coral CLI integration.",
  },
];

function Tabs({ active, onChange }: { active: string; onChange: (id: string) => void; children?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap gap-1 border-b border-border pb-px">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`flex items-center gap-2 rounded-t-md px-4 py-2.5 text-sm font-medium transition-colors ${
            active === tab.id
              ? "border border-b-white border-border bg-white text-info"
              : "text-muted hover:text-ink hover:bg-slate-50"
          }`}
        >
          <tab.icon className="h-4 w-4" />
          {tab.label}
        </button>
      ))}
    </div>
  );
}

function AccordionSection({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border rounded-lg border-border">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full px-4 py-3 text-left text-sm font-semibold text-ink hover:bg-slate-50"
      >
        {title}
        {open ? <ChevronDown className="h-4 w-4 text-muted" /> : <ChevronRight className="h-4 w-4 text-muted" />}
      </button>
      {open && <div className="px-4 pb-4 text-sm leading-6 text-muted">{children}</div>}
    </div>
  );
}

function FeatureCard({ title, desc }: { title: string; desc: string }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div
      className="rounded-md border border-border p-3 cursor-pointer hover:border-info transition-colors"
      onClick={() => setExpanded(!expanded)}
    >
      <div className="flex items-center justify-between">
        <h4 className="font-medium text-sm text-ink">{title}</h4>
        {expanded ? <ChevronDown className="h-3.5 w-3.5 text-muted" /> : <ChevronRight className="h-3.5 w-3.5 text-muted" />}
      </div>
      <p className={`mt-1 text-xs text-muted transition-all ${expanded ? "" : "line-clamp-2"}`}>{desc}</p>
    </div>
  );
}

export default function AboutPage() {
  const [activeTab, setActiveTab] = useState("overview");
  const [expandedTech, setExpandedTech] = useState<string | null>(null);

  return (
    <div className="space-y-6 max-w-4xl">
      <PageHeader title="About CareOps Agent" eyebrow="Coral Hackathon Track 2">
        A Coral-powered family care coordination first mate that turns scattered care records into one clean doctor-ready packet.
      </PageHeader>

      <SafetyNotice />

      <Card>
        <Tabs active={activeTab} onChange={setActiveTab} />

        {activeTab === "overview" && (
          <div className="pt-6 space-y-6">
            <p className="text-sm leading-6 text-muted">
              CareOps Agent helps families prepare for doctor visits by joining records from 9 sources — medications, lab reports, doctor chat instructions, pharmacy receipts, symptom logs, appointments, prescription OCR scans, and family notes — into a single organized packet.
            </p>

            <h4 className="font-semibold text-ink">Architecture Flow</h4>
            <MermaidDiagram
              chart={`
flowchart LR
    subgraph Input["Input Layer"]
        Q["Natural Language Query"]
        PS["Patient Selector"]
    end
    subgraph Engine["Coral Engine"]
        CCLI["Coral CLI Client"]
        CSQL["coral sql --format json"]
    end
    subgraph Sources["9 Data Sources"]
        P1["patients"]
        P2["medications"]
        P3["lab_reports"]
        P4["doctor_chats"]
        P5["pharmacy_receipts"]
        P6["symptom_logs"]
        P7["appointments"]
        P8["prescription_ocr"]
        P9["family_notes"]
    end
    subgraph Output["Output Layer"]
        PACKET["Doctor Visit Packet"]
        EXPORT["Markdown Export"]
        EVIDENCE["SQL Evidence Panel"]
    end
    Q --> CCLI
    PS --> CCLI
    CCLI --> CSQL
    CSQL --> Sources
    CSQL --> PACKET
    PACKET --> EXPORT
    PACKET --> EVIDENCE
              `}
              title="System Architecture"
            />

            <div className="grid gap-3 md:grid-cols-2">
              {[
                ["Current medicines", "Lists all active prescriptions with dosages and schedules"],
                ["Recent lab results", "Shows latest HbA1c, fasting glucose, and other test values"],
                ["Medicine change timeline", "Tracks when medicines were added or changed by the doctor"],
                ["Symptom tracking", "Logs symptoms recorded after medicine changes with severity ratings"],
                ["Refill evidence", "Pharmacy receipts confirming prescription fills"],
                ["Missing record detection", "Flags BP, weight, or other records not found"],
                ["Doctor questions", "Auto-generates questions to ask at the visit"],
                ["SQL evidence panel", "Shows the exact query and joined data backing every result"],
              ].map(([title, desc]) => (
                <FeatureCard key={title} title={title} desc={desc} />
              ))}
            </div>
          </div>
        )}

        {activeTab === "how-to" && (
          <div className="pt-6 space-y-3">
            <ol className="space-y-3 text-sm leading-6 text-muted list-decimal pl-5">
              <li><strong className="text-ink">Open the Dashboard</strong> — See patient stats, connected data sources, and a natural language query input with interactive architecture diagram.</li>
              <li><strong className="text-ink">Select a patient</strong> — Use the patient dropdown to pick who you're asking about.</li>
              <li><strong className="text-ink">Ask a question</strong> — Type something like &ldquo;Prepare a doctor visit packet for Raman Mehta&rdquo; and click Ask.</li>
              <li><strong className="text-ink">View the result</strong> — The answer appears with tabs for Execution Log, SQL, and Sources used.</li>
              <li><strong className="text-ink">Browse data sources</strong> — Visit the Data Sources page to see all 9 connected care record types with live CLI actions.</li>
              <li><strong className="text-ink">Explore analytics</strong> — The Analytics dashboard shows per-patient KPIs, symptom severity charts, and cross-patient comparisons.</li>
              <li><strong className="text-ink">View patient profile</strong> — The Patient page shows demographics, current medicines, and upcoming appointments.</li>
              <li><strong className="text-ink">Explore the timeline</strong> — A cross-source chronology of all events (medications, labs, symptoms, chats, refills).</li>
              <li><strong className="text-ink">Generate a packet</strong> — The Packet page shows the auto-generated doctor visit packet with medicines, labs, symptoms, and missing records.</li>
              <li><strong className="text-ink">Review SQL evidence</strong> — The Evidence page displays the exact Coral SQL queries and resulting data.</li>
              <li><strong className="text-ink">Export</strong> — Click &ldquo;Export markdown&rdquo; to download a printable doctor-ready document.</li>
            </ol>
          </div>
        )}

        {activeTab === "tech-stack" && (
          <div className="pt-6 space-y-3">
            <p className="text-sm text-muted">Click a technology to learn more about its role in CareOps.</p>
            <div className="grid gap-3 md:grid-cols-2">
              {techItems.map((tech) => (
                <div
                  key={tech.name}
                  className={`rounded-lg border p-4 cursor-pointer transition-all ${
                    expandedTech === tech.name ? "border-info bg-blue-50" : "border-border hover:border-info"
                  }`}
                  onClick={() => setExpandedTech(expandedTech === tech.name ? null : tech.name)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <tech.icon className="h-4 w-4 text-info" />
                      <span className="font-semibold text-sm text-ink">{tech.name}</span>
                    </div>
                    <Badge tone="neutral">{tech.category}</Badge>
                  </div>
                  {expandedTech === tech.name && (
                    <p className="mt-3 text-xs leading-5 text-muted">{tech.detail}</p>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-6">
              <h4 className="font-semibold text-ink mb-3">Data Flow</h4>
              <MermaidDiagram
                chart={`
flowchart LR
    CSV["CSV Files\ndata/*.csv"] --> SQLITE["SQLite\ndatabase"]
    JSONL["JSONL Files\ndata/*.jsonl"] --> CORAL["Coral CLI\ncoral sql"]
    SQLITE --> CLIENT["CoralClient"]
    CORAL --> CLIENT
    CLIENT --> AGENT["Packet Generator"]
    AGENT --> UI["Next.js UI"]
    AGENT --> EXPORT["Markdown Export"]
                `}
                title="Data Flow"
              />
            </div>
          </div>
        )}

        {activeTab === "coral" && (
          <div className="pt-6 space-y-4">
            <p className="text-sm leading-6 text-muted">
              Coral is an open-source Model Context Protocol (MCP) server that provides a SQL-based abstraction layer over disparate data sources. CareOps uses Coral as its central query layer because answering care coordination questions requires joining data from 9 silos.
            </p>
            <div className="flex flex-wrap gap-3">
              <a href="https://github.com/withcoral/coral" className="inline-flex items-center gap-2 rounded-md bg-ink px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">
                <Github className="h-4 w-4" /> Coral on GitHub
              </a>
              <a href="https://coral.co" className="inline-flex items-center gap-2 rounded-md border border-border px-4 py-2 text-sm font-semibold text-ink hover:bg-slate-50">
                <ExternalLink className="h-4 w-4" /> coral.co
              </a>
            </div>

            <AccordionSection title="What problem does Coral solve?">
              Without Coral, CareOps would need 9 different API client libraries to fetch from the lab portal, the pharmacy portal, WhatsApp exports, etc., and then write complex map-reduce logic in Node.js to correlate them by date. With Coral, CareOps simply executes SQL queries against registered source specs.
            </AccordionSection>
            <AccordionSection title="How does CareOps use Coral?">
              Every API request goes through <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs">coral-cli-client.ts</code> which wraps <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs">coral sql --format json</code> via Node.js execFile. Results are parsed, joined, and assembled into a doctor visit packet. The app never hides the Coral layer — every response includes the raw SQL output.
            </AccordionSection>
            <AccordionSection title="What are Coral source specs?">
              Each source spec is a YAML manifest that tells Coral: the source name, the SQL table schema (column names, types), the data backend (JSONL in our case), and test queries. CareOps has 9 source specs plus an Ollama community spec.
            </AccordionSection>
            <AccordionSection title="Development vs. Production mode">
              In development mode, CareOps uses an embedded SQLite engine that mirrors the Coral spec architecture. Set <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs">CAREOPS_QUERY_MODE=sqlite</code> to test without the Coral CLI. Production mode (<code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs">coral_cli</code>, default) routes all queries through <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs">coral sql</code>.
            </AccordionSection>
          </div>
        )}
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
