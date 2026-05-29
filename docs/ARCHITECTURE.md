# CareOps Architecture

This document outlines the system architecture and data flow for the CareOps Agent.

## System Architecture

The application is built on Next.js but relies fundamentally on the **Coral CLI** as the query engine. Coral handles the cross-source joins, while the CareOps Agent focuses purely on the business logic of summarizing those joined rows and applying safety constraints.

```mermaid
flowchart TD
    UI["Next.js UI"] --> API["Next.js API Routes"]
    API --> Client["Coral CLI Client\n(src/lib/coral/coral-cli-client.ts)"]
    Client --> CLI["coral sql (--format json)"]
    CLI --> Sources["9 Registered CareOps Coral Sources\n(coral source add --file)"]
    Sources --> JSONL["JSONL Synthetic Care Records\n(data/*.jsonl)"]
    CLI --> Result["Joined SQL Result"]
    Result --> Agent["CareOps Packet Generator"]
    Agent --> Packet["Doctor Visit Packet"]
    Packet --> Evidence["SQL Evidence Panel\nRaw Coral Output Viewer"]
```

## API Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/coral/source-list` | GET | Runs `coral source list`, returns parsed sources with mode info |
| `/api/coral/source-action` | POST | Accepts `{action, sourceName}` — runs lint/add/test/query against real Coral CLI |
| `/api/coral/run-query` | GET | Runs a cross-source JOIN query for a given patientId |
| `/api/care-packet` | GET | Full packet pipeline: source list → patient profile → 7 individual queries → cross-source JOIN |
| `/api/query` | GET | Natural-language-style query endpoint |
| `/api/packet` | GET | Legacy packet endpoint |
| `/api/export` | GET | Markdown export of the doctor visit packet |

## Query Execution Modes

| Mode | Engine | Default | When Used |
|------|--------|---------|-----------|
| `coral_cli` | Real `coral sql` via CLI | Yes | Production demo |
| `sqlite` | `better-sqlite3` | No | Fallback / offline |
| `mock` | `better-sqlite3` | No | Tests only |

Set via `CAREOPS_QUERY_MODE` env var. Default is `coral_cli`.

## Data Flow: Doctor Visit Packet

When a user requests a Doctor Visit Packet, the system follows this sequence:

```mermaid
sequenceDiagram
    participant U as User
    participant UI as CareOps UI
    participant API as Next.js API Route
    participant CLI as Coral CLI Client
    participant SQL as coral sql
    participant Sources as Coral Sources (9)

    U->>UI: Select patient + visit purpose
    UI->>API: GET /api/care-packet?patientId=pat-001&purpose=...
    API->>CLI: runCoralSourceList()
    CLI->>SQL: coral source list
    SQL-->>CLI: source names + versions
    CLI-->>API: parsed sources

    API->>CLI: runCoralSql(getPatientProfile(pid))
    CLI->>SQL: coral sql --format json "SELECT ..."
    SQL->>Sources: careops_patients.patients
    Sources-->>SQL: patient data
    SQL-->>CLI: JSON rows
    CLI-->>API: parsed patient

    API->>CLI: 7 parallel queries (medicines, labs, symptoms, etc.)
    CLI->>SQL: coral sql --format json "SELECT ..."
    SQL-->>CLI: individual source results

    API->>CLI: runCoralSql(getCarePacketJoinQuery(pid))
    CLI->>SQL: coral sql --format json "SELECT 7-way JOIN ..."
    SQL->>Sources: careops_medications, careops_lab_reports, ...
    Sources-->>SQL: joined evidence
    SQL-->>CLI: JSON rows
    CLI-->>API: evidence rows + raw output

    API->>API: Generate packet (summary, questions, missing records)
    API-->>UI: { mode, commands, rawCoralOutput, packet, joinedRows }
    UI-->>U: Doctor-ready packet + SQL evidence
```

## Data Flow: Interactive Data Sources

Each source card on `/data-sources` can execute CLI actions independently:

```mermaid
sequenceDiagram
    participant U as User
    participant Client as DataSources Client
    participant API as POST /api/coral/source-action
    participant CLI as Coral CLI

    U->>Client: Click "Lint"
    Client->>API: { action: "lint", sourceName: "careops_patients" }
    API->>CLI: coral source lint coral/sources/careops/patients/manifest.yaml
    CLI-->>API: stdout/stderr
    API-->>Client: { command, stdout, stderr, success }
    Client->>Client: Update status badge + append execution log

    U->>Client: Click "Add"
    Client->>API: { action: "add", sourceName: "careops_patients" }
    API->>CLI: coral source add --file coral/sources/careops/patients/manifest.yaml
    CLI-->>API: registration result
    API-->>Client: { command, stdout, stderr, success }
    Client->>Client: Status → "registered"

    U->>Client: Click "Test"
    Client->>API: { action: "test", sourceName: "careops_patients" }
    API->>CLI: coral source test careops_patients
    CLI-->>API: test results
    API-->>Client: { command, stdout, stderr, success }
    Client->>Client: Status → "tests_passed"

    U->>Client: Click "Query"
    Client->>API: { action: "query", sourceName: "careops_patients" }
    API->>CLI: coral sql --format json "SELECT * FROM careops_patients.patients LIMIT 5"
    CLI-->>API: JSON rows
    API-->>Client: { command, rows, success }
    Client->>Client: Render inline table
```

## Core Files

| File | Purpose |
|------|---------|
| `src/lib/coral/coral-cli-client.ts` | Safe `coral sql` / `source list` / `source lint` / `source add` / `source test` wrapper via `execFile` |
| `src/lib/coral/careops-queries.ts` | 10 predefined SQL query templates (no raw SQL from browser) |
| `src/lib/coral/coral-output-parser.ts` | Parse `--format json` and `source list` output |
| `src/lib/coral/client.ts` | Mode-switching CoralClient (CLI / SQLite / Mock) |
| `app/api/coral/source-list/route.ts` | Run `coral source list`, return parsed JSON |
| `app/api/coral/source-action/route.ts` | Run lint/add/test/query actions per source |
| `app/api/coral/run-query/route.ts` | Run `coral sql --format json`, return parsed rows |
| `app/api/care-packet/route.ts` | Full packet pipeline via 10+ real coral sql calls |
| `app/data-sources/data-sources-client.tsx` | Interactive client component with CLI buttons |
| `app/evidence/page.tsx` | Interactive Coral proof page (3 action buttons) |

## The Role of Coral

Coral acts as the universal query engine. Without Coral, CareOps would need 9 different API client libraries to fetch from the lab portal, the pharmacy portal, WhatsApp exports, etc., and then write complex `map-reduce` logic in Node.js to correlate them by date.

With Coral, CareOps simply executes SQL queries against registered source specs, leaving the heavy lifting of data unification to the Coral engine.

The app never hides the Coral layer. Every API response includes:
- `mode` (always `coral_cli` in production)
- `commands` (real CLI commands executed)
- `rawCoralOutput` (raw stdout from `coral sql`)
- `sourcesUsed` (registered Coral source names)
