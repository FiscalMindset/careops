# Agent Handoff: CareOps Agent

## Current Status

CareOps Agent is implemented as a Next.js app with mock Coral mode, synthetic data, UI routes, markdown export, tests, custom spec docs, and hackathon documentation.

## Important Paths

- App routes: `app/`
- Components: `src/components/`
- Agent: `src/lib/agent/careops-agent.ts`
- Coral abstraction: `src/lib/coral/`
- Data loader: `src/lib/data/`
- Seed data: `data/`
- Coral spec proposals: `coral/specs/`
- Docs: `docs/`
- PR summaries: `docs/prs/`
- Exports: `exports/`

## Coral MCP Inspection

Coral MCP is available in this environment. It currently exposes GitHub and Kairon tables, not CareOps tables. CareOps therefore uses local mock Coral tables and documents custom specs for upstream contribution.

## Safety Rule

Do not add diagnosis, prescription, or medicine-change recommendations.

## Demo Patient

`pat-001` Raman Mehta, diabetes follow-up with current medicines, HbA1c/fasting glucose labs, symptom logs, receipts, doctor chats, appointment, prescription OCR, and family notes.
