# Graph Report - careops  (2026-05-29)

## Corpus Check
- 82 files · ~25,016 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 568 nodes · 724 edges · 70 communities (50 shown, 20 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `8d5f6fa5`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 22|Community 22]]
- [[_COMMUNITY_Community 23|Community 23]]
- [[_COMMUNITY_Community 24|Community 24]]
- [[_COMMUNITY_Community 25|Community 25]]
- [[_COMMUNITY_Community 26|Community 26]]
- [[_COMMUNITY_Community 27|Community 27]]
- [[_COMMUNITY_Community 28|Community 28]]
- [[_COMMUNITY_Community 29|Community 29]]
- [[_COMMUNITY_Community 30|Community 30]]
- [[_COMMUNITY_Community 31|Community 31]]
- [[_COMMUNITY_Community 32|Community 32]]
- [[_COMMUNITY_Community 33|Community 33]]
- [[_COMMUNITY_Community 34|Community 34]]
- [[_COMMUNITY_Community 35|Community 35]]
- [[_COMMUNITY_Community 36|Community 36]]
- [[_COMMUNITY_Community 37|Community 37]]
- [[_COMMUNITY_Community 38|Community 38]]
- [[_COMMUNITY_Community 39|Community 39]]
- [[_COMMUNITY_Community 40|Community 40]]
- [[_COMMUNITY_Community 41|Community 41]]
- [[_COMMUNITY_Community 42|Community 42]]
- [[_COMMUNITY_Community 43|Community 43]]
- [[_COMMUNITY_Community 44|Community 44]]
- [[_COMMUNITY_Community 45|Community 45]]
- [[_COMMUNITY_Community 46|Community 46]]
- [[_COMMUNITY_Community 47|Community 47]]
- [[_COMMUNITY_Community 48|Community 48]]
- [[_COMMUNITY_Community 49|Community 49]]
- [[_COMMUNITY_Community 50|Community 50]]
- [[_COMMUNITY_Community 51|Community 51]]
- [[_COMMUNITY_Community 52|Community 52]]
- [[_COMMUNITY_Community 53|Community 53]]
- [[_COMMUNITY_Community 54|Community 54]]
- [[_COMMUNITY_Community 55|Community 55]]
- [[_COMMUNITY_Community 56|Community 56]]
- [[_COMMUNITY_Community 57|Community 57]]
- [[_COMMUNITY_Community 58|Community 58]]
- [[_COMMUNITY_Community 59|Community 59]]
- [[_COMMUNITY_Community 60|Community 60]]
- [[_COMMUNITY_Community 61|Community 61]]
- [[_COMMUNITY_Community 62|Community 62]]
- [[_COMMUNITY_Community 63|Community 63]]
- [[_COMMUNITY_Community 64|Community 64]]
- [[_COMMUNITY_Community 65|Community 65]]
- [[_COMMUNITY_Community 66|Community 66]]

## God Nodes (most connected - your core abstractions)
1. `generateDoctorVisitPacket()` - 18 edges
2. `CareOps Custom Source Specs` - 12 edges
3. `Doctor Visit Packet: Raman Mehta` - 11 edges
4. `resolveThemeVariant()` - 10 edges
5. `createMainWindow()` - 10 edges
6. `loadCareOpsData()` - 10 edges
7. `PR #11: Agent Handoff/Status Folder` - 10 edges
8. `PR #12: Video Demo Storyboard` - 10 edges
9. `getStore()` - 9 edges
10. `PageHeader()` - 9 edges

## Surprising Connections (you probably didn't know these)
- `GET()` --calls--> `generateDoctorVisitPacket()`  [EXTRACTED]
  app/api/packet/route.ts → src/lib/agent/careops-agent.ts
- `DataSourcesPage()` --calls--> `loadCareOpsData()`  [EXTRACTED]
  app/data-sources/page.tsx → src/lib/data/load-careops-data.ts
- `EvidencePage()` --calls--> `generateDoctorVisitPacket()`  [EXTRACTED]
  app/evidence/page.tsx → src/lib/agent/careops-agent.ts
- `PacketPage()` --calls--> `generateDoctorVisitPacket()`  [EXTRACTED]
  app/packet/page.tsx → src/lib/agent/careops-agent.ts
- `PatientsPage()` --calls--> `generateDoctorVisitPacket()`  [EXTRACTED]
  app/patients/page.tsx → src/lib/agent/careops-agent.ts

## Communities (70 total, 20 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.06
Nodes (51): assertSafetyBoundary(), detectMissingRecords(), generateDoctorVisitPacket(), DashboardPage(), Badge(), Card(), ExportButton(), MissingRecordAlert() (+43 more)

### Community 1 - "Community 1"
Cohesion: 0.04
Nodes (28): APP_IDS, APP_NAMES, cache, createSidecarEnv(), dark, defer(), DESKTOP_MENU, emitDeepLinks() (+20 more)

### Community 2 - "Community 2"
Cohesion: 0.1
Nodes (20): 🪸 About Coral, 🧑‍💻 About Me, 🏛️ Architecture, code:mermaid (flowchart TD), code:bash (git clone https://github.com/FiscalMindset/careops.git), code:bash (cp .env.example .env.local), code:bash (npm run seed), code:bash (npm run dev) (+12 more)

### Community 3 - "Community 3"
Cohesion: 0.18
Nodes (19): blend(), clamp(), fitOklch(), generateNeutralAlphaScale(), generateNeutralScale(), generateScale(), getColors(), getHex() (+11 more)

### Community 4 - "Community 4"
Cohesion: 0.16
Nodes (12): box, dot, dots, highlightScene(), id, match, observer, scenes (+4 more)

### Community 5 - "Community 5"
Cohesion: 0.14
Nodes (13): 1. careops_patients_spec, 2. careops_medications_spec, 3. careops_lab_reports_spec, 4. careops_doctor_chats_spec, 5. careops_pharmacy_receipts_spec, 6. careops_symptom_logs_spec, 7. careops_appointments_spec, 8. careops_prescription_ocr_spec (+5 more)

### Community 6 - "Community 6"
Cohesion: 0.21
Nodes (13): checkAndDownloadUpdate(), checkForUpdates(), checkUpdate(), getLogger(), getUserShell(), installUpdate(), isNushell(), loadShellEnv() (+5 more)

### Community 7 - "Community 7"
Cohesion: 0.15
Nodes (12): code:sql, Coral SQL Evidence, Current Medicines, Doctor Visit Packet: Raman Mehta, Medicine Changes Since Last Visit, Missing Records, Questions To Ask Doctor, Recent Labs (+4 more)

### Community 8 - "Community 8"
Cohesion: 0.29
Nodes (12): allowRendererPermissions(), createLoadingWindow(), createMainWindow(), createUnresponsiveSampler(), defaultBackgroundColor(), iconPath(), iconsDir(), loadWindow() (+4 more)

### Community 9 - "Community 9"
Cohesion: 0.2
Nodes (11): getDefaultServerUrl(), getPinchZoomEnabled(), getStore(), getWslConfig(), migrate(), migrateFile(), setDefaultServerUrl(), setWslConfig() (+3 more)

### Community 10 - "Community 10"
Cohesion: 0.18
Nodes (10): Coral Relevance, Files Created, Implementation Details, PR #11: Agent Handoff/Status Folder, Problem Solved, Remaining Limitations, Safety Notes, Summary (+2 more)

### Community 11 - "Community 11"
Cohesion: 0.18
Nodes (10): Coral Relevance, Files Changed, Implementation Details, PR #12: Video Demo Storyboard, Problem Solved, Remaining Limitations, Safety Notes, Summary (+2 more)

### Community 12 - "Community 12"
Cohesion: 0.2
Nodes (9): CareOps Project Graph, code:block1 (careops/), code:block2 (UI (app/) → components/ui.tsx → agent/careops-agent.ts → cor), code:block3 (CSV files (/data/) → loadCareOpsData() → Zod validation → Ty), Data Flow, Dependency Graph, Key Modules, Project Structure (+1 more)

### Community 13 - "Community 13"
Cohesion: 0.28
Nodes (9): collect(), exportDebugLogs(), initCrashReporter(), manifest(), safeLogName(), serverLogRoots(), startNetLog(), write() (+1 more)

### Community 14 - "Community 14"
Cohesion: 0.22
Nodes (8): code:bash (# 1. Install dependencies), Commands, Generate Packet, Mock Mode (Default), Prerequisites, Quick Start, Running CareOps Agent, Troubleshooting

### Community 15 - "Community 15"
Cohesion: 0.25
Nodes (7): Coral, Environment, Key Files, Next Agent Guide, Next Steps, Quick Start, Safety

### Community 16 - "Community 16"
Cohesion: 0.25
Nodes (7): Coral Relevance, Files Changed, PR: Project setup and design system, Safety Notes, Screenshots, Summary, Tests Run

### Community 17 - "Community 17"
Cohesion: 0.25
Nodes (7): Coral Relevance, Files Changed, PR: Seed synthetic care dataset, Safety Notes, Screenshots, Summary, Tests Run

### Community 18 - "Community 18"
Cohesion: 0.25
Nodes (7): Coral Relevance, Files Changed, PR: Coral/mock Coral source layer, Safety Notes, Screenshots, Summary, Tests Run

### Community 19 - "Community 19"
Cohesion: 0.25
Nodes (7): Coral Relevance, Files Changed, PR: Custom care source specs, Safety Notes, Screenshots, Summary, Tests Run

### Community 20 - "Community 20"
Cohesion: 0.25
Nodes (7): Coral Relevance, Files Changed, PR: Care timeline UI, Safety Notes, Screenshots, Summary, Tests Run

### Community 21 - "Community 21"
Cohesion: 0.25
Nodes (7): Coral Relevance, Files Changed, PR: Doctor packet builder, Safety Notes, Screenshots, Summary, Tests Run

### Community 22 - "Community 22"
Cohesion: 0.25
Nodes (7): Coral Relevance, Files Changed, PR: Coral SQL evidence panel, Safety Notes, Screenshots, Summary, Tests Run

### Community 23 - "Community 23"
Cohesion: 0.25
Nodes (7): Coral Relevance, Files Changed, PR: Export markdown packet, Safety Notes, Screenshots, Summary, Tests Run

### Community 24 - "Community 24"
Cohesion: 0.25
Nodes (7): Coral Relevance, Files Changed, PR: Tests and validation, Safety Notes, Screenshots, Summary, Tests Run

### Community 25 - "Community 25"
Cohesion: 0.25
Nodes (7): Coral Relevance, Files Changed, PR: Documentation and demo script, Safety Notes, Screenshots, Summary, Tests Run

### Community 26 - "Community 26"
Cohesion: 0.25
Nodes (7): Coral Relevance, Files Changed, PR: Project Setup and Design System, Safety Notes, Screenshots, Summary, Tests Run

### Community 27 - "Community 27"
Cohesion: 0.29
Nodes (6): Broken / Fake, Bugs Fixed, Existing Files That Work, Missing (Now Created), Project Audit Report, What Works

### Community 28 - "Community 28"
Cohesion: 0.29
Nodes (6): CareOps Architecture, code:mermaid (flowchart TD), code:mermaid (sequenceDiagram), Data and Request Flow, System Architecture, The Role of Coral

### Community 29 - "Community 29"
Cohesion: 0.29
Nodes (6): Coral Relevance, Files Changed, PR: Tests and Validation, Safety Notes, Summary, Tests Run

### Community 30 - "Community 30"
Cohesion: 0.29
Nodes (6): Coral Relevance, Files Changed, PR: Documentation and Demo Script, Safety Notes, Summary, Tests Run

### Community 31 - "Community 31"
Cohesion: 0.29
Nodes (6): Coral Relevance, Files Changed, PR: Seed Synthetic Care Dataset, Safety Notes, Summary, Tests Run

### Community 32 - "Community 32"
Cohesion: 0.29
Nodes (6): Coral Relevance, Files Changed, PR: Coral/Mock Coral Source Layer, Safety Notes, Summary, Tests Run

### Community 33 - "Community 33"
Cohesion: 0.29
Nodes (6): Coral Relevance, Files Changed, PR: Custom Care Source Specs, Safety Notes, Summary, Tests Run

### Community 34 - "Community 34"
Cohesion: 0.29
Nodes (6): Coral Relevance, Files Changed, PR: Care Timeline UI, Safety Notes, Summary, Tests Run

### Community 35 - "Community 35"
Cohesion: 0.29
Nodes (6): Coral Relevance, Files Changed, PR: Doctor Visit Packet Builder, Safety Notes, Summary, Tests Run

### Community 36 - "Community 36"
Cohesion: 0.29
Nodes (6): Coral Relevance, Files Changed, PR: Coral SQL Evidence Panel, Safety Notes, Summary, Tests Run

### Community 37 - "Community 37"
Cohesion: 0.29
Nodes (6): Coral Relevance, Files Changed, PR: Export Markdown Packet, Safety Notes, Summary, Tests Run

### Community 38 - "Community 38"
Cohesion: 0.29
Nodes (6): Agent Handoff: CareOps Agent, Coral MCP Inspection, Current Status, Demo Patient, Important Paths, Safety Rule

### Community 39 - "Community 39"
Cohesion: 0.4
Nodes (6): checkAppExists(), checkMacosApp(), execFilePromise, exists(), resolveAppPath(), resolveWindowsAppPath()

### Community 40 - "Community 40"
Cohesion: 0.33
Nodes (6): runDesktopMenuAction(), setPinchZoomEnabled(), setTitlebar(), setZoom(), updateTitlebar(), updateZoom()

### Community 41 - "Community 41"
Cohesion: 0.33
Nodes (5): Adding a New Source Spec, Coding Style, Contributing to CareOps, PR Workflow, Safety Boundaries (CRITICAL)

### Community 42 - "Community 42"
Cohesion: 0.33
Nodes (5): CareOps Test Output, code:bash (> careops-agent@0.1.0 test), Known Limitations, Summary, What Is Tested

### Community 43 - "Community 43"
Cohesion: 0.4
Nodes (5): cleanup(), initConsoleTransport(), initLogging(), initRunDirectory(), stamp()

### Community 44 - "Community 44"
Cohesion: 0.4
Nodes (4): API Keys and Environment Variables, Keeping Keys Safe, `NEXT_PUBLIC_USE_MOCK_CORAL=true`, Optional Keys (Real Mode)

### Community 45 - "Community 45"
Cohesion: 0.4
Nodes (4): Agent Handoff Context, Known Limitations, Project State: CareOps Agent, Running the App

### Community 46 - "Community 46"
Cohesion: 0.5
Nodes (4): addRendererHeaders(), isRendererUrl(), isTrustedRendererUrl(), upsertKeyValue()

## Knowledge Gaps
- **277 isolated node(s):** `nextConfig`, `config`, `light`, `dark`, `oc2ThemeJson` (+272 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **20 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What connects `nextConfig`, `config`, `light` to the rest of the system?**
  _277 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.06 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.04 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.1 - nodes in this community are weakly interconnected._
- **Should `Community 5` be split into smaller, more focused modules?**
  _Cohesion score 0.14 - nodes in this community are weakly interconnected._