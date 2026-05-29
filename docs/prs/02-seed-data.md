# PR: Seed Synthetic Care Dataset

## Summary
Created a robust script to load synthetic healthcare CSV data into a local SQLite database (`careops.db`). This acts as the Mock Coral instance, simulating what the real Coral MCP would return when queried.

## Files Changed
- `scripts/seed.ts`: Rewrote to use `better-sqlite3`, dynamically creating tables with the prefix `careops_*_spec` (as required for the mock Coral SQL specs) and inserting the CSV rows.
- `package.json`: Added `better-sqlite3` and its types to dependencies.
- `data/*.csv`: Verified synthetic data rows for patients, medications, labs, chats, receipts, symptoms, appointments, OCR, and family notes.

## Tests Run
- Successfully executed `npm run seed`. 
- Verified `careops.db` is generated with 9 tables and populated with rows.

## Coral Relevance
The tables are named `careops_patients_spec`, `careops_medications_spec`, etc. This aligns exactly with the custom Coral specs described in the PRD, allowing our SQL query layer to run the same queries in mock mode as it would against the real Coral MCP.

## Safety Notes
All seed data is completely synthetic and generated for demonstration purposes. No real patient data is included or processed.
