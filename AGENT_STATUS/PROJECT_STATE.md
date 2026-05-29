# Project State: CareOps Agent

**Status**: 🟢 Fully Implemented

## Agent Handoff Context
If you are an agent taking over this workspace, here is what you need to know:

- **Goal**: Hackathon Track 2 project building a Coral-powered personal agent to organize scattered medical records into a doctor visit packet.
- **Tech Stack**: Next.js (App router), TypeScript, Tailwind CSS, SQLite (local engine), Vitest.
- **Coral Integration**: `CoralClient` in `src/lib/coral/client.ts` provides a clean abstraction. Toggles between local SQLite engine and real Coral MCP via `NEXT_PUBLIC_USE_MOCK_CORAL`. Local mode requires zero external services.
- **Natural Language Queries**: Dashboard includes a query input that processes patient questions through the packet API.
- **Custom Specs**: 9 custom Coral-compatible schemas in `/data` + `/coral/specs/`. Documented in `/docs/SPECS.md`.
- **Key Files**:
  - `src/lib/agent/careops-agent.ts`: Core packet generation logic
  - `src/lib/coral/queries.ts`: Cross-source SQL join queries
  - `src/components/query-input.tsx`: Natural language query interface
  - `scripts/seed.ts`: CSV → SQLite database seeder
- **Docs**: 12 PR-style docs in `/docs/prs/`, 12+ doc files in `/docs/`, handoff in `/AGENT_HANDOFF/`

## Running the App
1. `npm run seed` to load the database
2. `npm run dev` to start the UI
3. Open http://localhost:3000 — dashboard with query input
4. `npm run test` to run tests
5. `npm run export:packet` to generate markdown packet

## Architecture
- Local development: SQLite engine (zero setup, no keys)
- Production: Set `NEXT_PUBLIC_USE_MOCK_CORAL=false` + configure Coral MCP server
- All LLM keys are optional
