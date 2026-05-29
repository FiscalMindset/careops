# Next Agent Guide

## Quick Start

1. `npm run seed` (if careops.db missing)
2. `npm run dev` (start Next.js)
3. `npm run test` (run tests)
4. `npm run export:packet` (generate markdown export)

## Key Files

| File | Purpose |
|------|---------|
| `src/lib/agent/careops-agent.ts` | Main packet generator |
| `src/lib/coral/client.ts` | Coral abstraction (mock/real toggle) |
| `src/lib/coral/queries.ts` | SQL queries |
| `src/lib/coral/mock-coral.ts` | Mock implementations |
| `src/lib/data/` | CSV loading and Zod validation |
| `src/components/ui.tsx` | All UI components |
| `app/` | Next.js pages |
| `scripts/seed.ts` | Database seeding |
| `scripts/export-packet.ts` | CLI export |

## Environment

- `NEXT_PUBLIC_USE_MOCK_CORAL=true` for mock mode (no API keys needed)
- All LLM keys are optional

## Coral

- Coral MCP available in env but only has GitHub tables
- Project uses mock mode with SQLite locally
- Architecture designed for real Coral MCP when tables exist

## Safety

- Never write code that diagnoses or prescribes
- Keep disclaimer visible in UI and exports
- Use safe language: "symptom was logged after medicine change" NOT "medicine caused symptom"

## Next Steps

1. Integrate real Coral MCP when CareOps tables are available
2. Add LLM-powered packet summarization (optional)
3. Add PDF export
4. Add WhatsApp/email integration
5. Add user authentication
