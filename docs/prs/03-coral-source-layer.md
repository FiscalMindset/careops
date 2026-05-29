# PR: Coral/Mock Coral Source Layer

## Summary
Implemented the data access layer for interacting with Coral, including support for a local SQLite Mock mode to allow development and testing without paid API keys or a running MCP server.

## Files Changed
- `src/lib/coral/client.ts`: Created `CoralClient` which switches between using `better-sqlite3` locally (mock) or fetching from `CORAL_MCP_SERVER_URL` with an auth token (real).
- `src/lib/coral/queries.ts`: Added central, cross-source analytical SQL queries:
  - `DOCTOR_VISIT_PACKET_QUERY`: The core cross-source join (as requested).
  - `PATIENT_SUMMARY_QUERY`: Quick view for the dashboard.
  - `TIMELINE_QUERY`: Generates a chronological unified view of events.

## Tests Run
- Compiled `src/lib/coral/client.ts` successfully.

## Coral Relevance
This is the core abstraction layer. The `executeRealCoralQuery` method acts as a bridge to the Coral MCP server, pushing our custom SQL queries to Coral and receiving the unified results. By isolating this, the rest of the Next.js app remains agnostic of whether it's talking to real Coral MCP or our local SQLite mock.

## Safety Notes
All data interactions go through parameterized queries or `?` placeholders to prevent SQL injection in mock mode. The mock mode does not connect to any external services.
