# Project Audit Report

## Existing Files That Work

- **package.json** — all scripts defined (dev, build, test, seed, export:packet, lint)
- **.env.example & .env.local** — with `NEXT_PUBLIC_USE_MOCK_CORAL=true`
- **tailwind.config.ts** — clean healthcare theme
- **app/globals.css** — white bg, black text
- **app/layout.tsx** — sidebar nav with 8 routes
- **app/page.tsx** — dashboard with natural language query input
- **app/data-sources/page.tsx**
- **app/patients/page.tsx**
- **app/timeline/page.tsx**
- **app/packet/page.tsx**
- **app/evidence/page.tsx**
- **app/exports/page.tsx**
- **app/about/page.tsx**
- **app/api/export/route.ts**
- **app/api/packet/route.ts**
- **src/components/ui.tsx** — 11 components
- **src/components/query-input.tsx** — natural language query interface
- **src/lib/coral/client.ts** — CoralClient (local SQLite engine / Coral MCP modes)
- **src/lib/coral/queries.ts** — SQL queries
- **src/lib/coral/mock-coral.ts** — local join/timeline builders
- **src/lib/agent/careops-agent.ts** — packet generator
- **src/lib/data/csv.ts** — CSV loader
- **src/lib/data/load-careops-data.ts** — Zod-validated data loader
- **src/lib/export/markdown.ts** — markdown export
- **src/types/careops.ts** — all TypeScript types
- **scripts/seed.ts** — SQLite seeder
- **scripts/export-packet.ts** — CLI export
- **tests/careops.test.ts** — 7 tests
- **vitest.config.ts**
- **data/*.csv** — 9 CSV files, 3 patients, realistic diabetes data
- **coral/specs/** — 10 files (9 spec docs + README)
- **docs/** — all docs
- **docs/prs/** — 12 PR docs
- **AGENT_HANDOFF/** — handoff files
- **AGENT_STATUS/** — status files
- **video_demo/** — 8-scene walkthrough storyboard
- **exports/** — export output

## What Works

- `npm install` works
- `npm run seed` works (creates careops.db with 9 tables, 38 rows total)
- `npm run test` works (7/7 tests pass)
- `npm run export:packet` works (generates markdown export)
- `npm run build` works (compiles, type-checks, generates static pages)
- Local development mode runs without any API keys
- All 8 UI pages render (Dashboard, Data Sources, Patient, Timeline, Packet, Evidence, Exports, About)
- Natural language query input on Dashboard processes patient queries
- Safety disclaimer visible in UI, README, export
- Cross-source joins work via SQLite
- Video demo storyboard with auto-presentation mode

## Architecture Decisions

- **Local Development Mode**: Embedded SQLite engine enables zero-dependency local development and testing. No API keys, no external services needed.
- **Coral MCP Ready**: The architecture uses a clean abstraction layer (`CoralClient`) that toggles between local SQLite and real Coral MCP. When CareOps tables are available on a Coral MCP server, set `NEXT_PUBLIC_USE_MOCK_CORAL=false`.
- **Deterministic Packet Generation**: Core functionality works without any external API dependency. LLM keys (OpenAI, Groq, Anthropic) are optional enhancements for richer summarization.
- **9 Source Specs**: Custom Coral-compatible source specs defined for all data types. These are proposed contributions to the Coral open-source project.

## Bugs Fixed

1. **mock-coral.ts** imported `CAREOPS_JOIN_SQL` which wasn't exported from `queries.ts` — fixed by adding the export
2. Scripts didn't load `.env.local` — fixed by setting env vars directly in CLI scripts
3. macOS resource fork `._` files caused test suite failures — fixed by deleting them and adding to `.gitignore`
4. Type errors in timeline page and agent module — fixed with proper type annotations
