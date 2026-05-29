# CareOps Agent Issue Plan

This project uses local issue and PR-style documents because no GitHub remote is configured in this workspace and nothing should be pushed without explicit permission.

| Issue | Branch | Scope | Commit message |
| --- | --- | --- | --- |
| #1 Project setup and design system | `feature/01-project-setup` | Next.js, TypeScript, Tailwind, route shell, reusable UI primitives | `feat: scaffold careops app shell and design system` |
| #2 Seed synthetic care dataset | `feature/02-seed-data` | Synthetic CSV sources for patients, meds, labs, chats, OCR, receipts, symptoms, appointments, notes | `feat: add synthetic care coordination dataset` |
| #3 Coral/mock Coral source layer | `feature/03-coral-layer` | Coral client abstraction, mock query engine, typed data loader | `feat: add coral query abstraction and mock source layer` |
| #4 Custom care source specs | `feature/04-custom-specs` | Document proposed CareOps Coral source specs | `docs: add custom careops coral source specs` |
| #5 Care timeline UI | `feature/05-care-timeline-ui` | Joined timeline view across records | `feat: add cross-source care timeline` |
| #6 Doctor packet builder | `feature/06-packet-builder` | Agent packet module and packet generation UI | `feat: generate safe doctor visit packets` |
| #7 Coral SQL evidence panel | `feature/07-evidence-panel` | SQL query display, sources, joined rows, confidence labels | `feat: expose coral sql evidence panel` |
| #8 Export markdown packet | `feature/08-markdown-export` | Markdown export route and CLI export | `feat: export doctor packet markdown` |
| #9 Tests and validation | `feature/09-tests-validation` | Vitest coverage for data, joins, safety, export | `test: cover careops data and packet workflows` |
| #10 Documentation and demo script | `feature/10-docs-demo` | README, architecture, commands, API keys, video script, agent handoff | `docs: polish hackathon submission materials` |

## GitHub Notes

- `gh` issue/PR creation is intentionally not attempted because this workspace has no initialized repository or remote.
- Local PR-style summaries live under `docs/prs`.
- The README lists custom Coral specs that are not currently available in the real Coral table list and can be contributed upstream.
