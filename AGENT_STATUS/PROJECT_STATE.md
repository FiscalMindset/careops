# Project State: CareOps Agent

**Status**: 🟢 Fully Implemented

## Agent Handoff Context
If you are an agent taking over this workspace, here is what you need to know:

- **Goal**: This is a Hackathon Track 2 project building a Coral-powered personal agent to organize scattered medical records into a doctor visit packet.
- **Tech Stack**: Next.js (App router), Tailwind, local SQLite mock (`careops.db`), and Vitest.
- **Coral Integration**: We abstract Coral through `src/lib/coral/client.ts`. It toggles between real MCP fetches and local SQLite queries based on `NEXT_PUBLIC_USE_MOCK_CORAL=true`.
- **Custom Specs**: We built 9 custom schemas matching the CSV data in `/data`. These are documented in `/docs/SPECS.md`.
- **Key Files**:
  - `src/lib/agent/careops-agent.ts`: The core logic that builds the packet.
  - `src/lib/coral/queries.ts`: The cross-source `SELECT ... LEFT JOIN` queries.
  - `scripts/seed.ts`: Converts CSVs to SQLite tables simulating Coral.
- **Workflow**: We simulated 10 Pull Requests for this project, documented in `/docs/prs/`.

## Running the App
1. `npm run seed` to load the database.
2. `npm run dev` to start the UI.
3. `npm run test` to run tests.
4. `npm run export:packet` to generate the markdown packet offline.

## Known Limitations
- The "Coral" engine is simulated locally via SQLite for demo purposes.
- Patient data is entirely synthetic.
- `vitest` throws an esbuild error if macOS `._*` resource fork files are left in the test directory, but the actual tests pass.
