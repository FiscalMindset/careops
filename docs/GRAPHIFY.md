# CareOps Project Graph

## Project Structure

```
careops/
├── app/                    # Next.js App Router pages
│   ├── about/              # About page
│   ├── api/                # API routes (export, packet, coral/*, query)
│   ├── data-sources/       # Interactive data sources page
│   ├── evidence/           # Coral SQL evidence page
│   ├── exports/            # Exports page
│   ├── packet/             # Doctor visit packet page
│   ├── patients/           # Patient profile page
│   ├── timeline/           # Care timeline page
│   ├── globals.css         # Global styles
│   ├── layout.tsx          # Root layout with sidebar
│   └── page.tsx            # Dashboard
├── src/
│   ├── components/
│   │   ├── ui.tsx          # Reusable UI components
│   │   └── query-input.tsx # Natural language query input
│   ├── lib/
│   │   ├── agent/          # CareOps agent (packet generator)
│   │   ├── coral/          # Coral CLI client, queries, output parser
│   │   ├── data/           # CSV loader + Zod validation
│   │   └── export/         # Markdown export
│   ├── types/careops.ts    # TypeScript types
├── data/                   # Synthetic JSONL + CSV data (9 sources)
├── coral/sources/          # Custom Coral source manifests
├── scripts/                # Seed + export CLI + test-coral
├── tests/                  # Vitest tests (16)
├── docs/                   # Documentation
├── AGENT_HANDOFF/          # Agent handoff files
├── AGENT_STATUS/           # Status files
├── video_demo/             # Video storyboard
└── exports/                # Generated exports
```

## Dependency Graph

```
UI (app/) → components/ → agent/careops-agent.ts → coral/client.ts
                                                     ├─ coral-cli-client.ts (coral sql exec)
                                                     ├─ careops-queries.ts (SQL templates)
                                                     └─ coral-output-parser.ts (JSON parse)
                                  → data/load-careops-data.ts → data/csv.ts
                                  → types/careops.ts
```

## Runtime Flow (Coral CLI Mode)

1. User navigates to page
2. Page/server component calls `CoralClient.executeQuery(sql)` or API route
3. API route calls `runCoralSql()` → `execFile("coral", ["sql", "--format", "json", sql])`
4. Coral CLI queries registered JSONL-backed sources
5. Results parsed by `parseCoralJsonResult()`
6. CareOps Agent assembles packet with safety constraints
7. Packet displayed in UI with Coral source evidence

## Data Flow

```
data/*.jsonl → coral source add --file → Coral CLI registry
                                       → coral sql --format json → JSON result
                                       → CoralClient → API → UI

data/*.csv → loadCareOpsData() → Zod validation → TypeScript types (static display only)
```

## Key Modules

- **CoralClient** (`src/lib/coral/client.ts`): Abstract query interface. Toggles between real Coral CLI, SQLite fallback, and mock modes based on `CAREOPS_QUERY_MODE`.
- **CLI Client** (`src/lib/coral/coral-cli-client.ts`): Safe `execFile` wrapper for `coral sql`, `coral source list`, `coral source lint`, `coral source add`, `coral source test`.
- **CareOps Queries** (`src/lib/coral/careops-queries.ts`): 10 predefined SQL templates with patient ID validation.
- **Output Parser** (`src/lib/coral/coral-output-parser.ts`): Parses JSON and table-formatted Coral CLI output.
- **Agent** (`src/lib/agent/careops-agent.ts`): Packet generation with safety constraints and missing record detection.
- **Data Loader** (`src/lib/data/load-careops-data.ts`): Zod-validated CSV parsing (for static display & fallback).
- **Export** (`src/lib/export/markdown.ts`): Markdown rendering of packets.
