# CareOps Agent Issue Plan

This project tracks work via GitHub Issues and local PR-style docs in `docs/prs/`.

## Issue Tracking

GitHub Issues: https://github.com/FiscalMindset/careops/issues

## Feature History

| # | Branch | Scope | Status |
|---|--------|-------|--------|
| 1 | `feature/01-project-setup` | Next.js, TypeScript, Tailwind, route shell, reusable UI primitives | ✅ Merged |
| 2 | `feature/02-seed-data` | Synthetic CSV sources for patients, meds, labs, chats, OCR, receipts, symptoms, appointments, notes | ✅ Merged |
| 3 | `feature/03-coral-layer` | Coral client abstraction, mock query engine, typed data loader | ✅ Merged |
| 4 | `feature/04-custom-specs` | Document proposed CareOps Coral source specs | ✅ Merged |
| 5 | `feature/05-care-timeline-ui` | Joined timeline view across records | ✅ Merged |
| 6 | `feature/06-packet-builder` | Agent packet module and packet generation UI | ✅ Merged |
| 7 | `feature/07-evidence-panel` | SQL query display, sources, joined rows, confidence labels | ✅ Merged |
| 8 | `feature/08-markdown-export` | Markdown export route and CLI export | ✅ Merged |
| 9 | `feature/09-tests-validation` | Vitest coverage for data, joins, safety, export | ✅ Merged |
| 10 | `feature/10-docs-demo` | README, architecture, commands, API keys, video script, agent handoff | ✅ Merged |
| 11 | `feature/11-agent-handoff` | AGENT_HANDOFF/ and AGENT_STATUS/ with audit, status, guide | ✅ Merged |
| 12 | `feature/12-video-demo` | video_demo/ with 8-scene storyboard, styles, script | ✅ Merged |
| 13 | `feature/13-coral-cli-migration` | Real Coral CLI integration: coral-cli-client, careops-queries, 9 JSONL manifests | ✅ Merged |
| 14 | `feature/14-interactive-sources` | Interactive data-sources page with CLI buttons, timeline rewrite, source-action API | ✅ Merged |

## Local PR Docs

PR-style summaries are kept in `docs/prs/` for reference. Each covers:
- **Summary**: What the PR does and why
- **Files Changed**: Key files and their purpose
- **Tests Run**: Verification steps
- **Coral Relevance**: How Coral is involved
- **Safety Notes**: Any safety considerations
