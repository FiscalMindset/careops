# PR: Coral SQL Evidence Panel

## Summary
Implemented the Coral SQL Evidence panel, which provides full transparency into how the agent aggregates data for the doctor visit packet.

## Files Changed
- `app/evidence/page.tsx`: Displays the raw SQL query string and a table rendering the raw joined evidence rows exactly as retrieved from Coral.
- `src/lib/agent/careops-agent.ts`: Updated to map the raw array-based `CoralQueryResult` rows into objects keyed by column name, ensuring seamless rendering in the Evidence table UI while appending a mock "confidence" label (which in production would come from Coral's data lineage/quality metrics).

## Tests Run
- Rendered the evidence table with `pat-001`. Verified that it successfully displays the `LEFT JOIN` results where a single medication row aligns with a subsequent symptom log and pharmacy receipt.

## Coral Relevance
The Evidence panel explicitly fulfills the hackathon requirement to show:
- Which sources were used (the custom specs)
- The raw Coral SQL query that joined them
- The joined rows/evidence that prove the packet is backed by real, auditable data traces.
This makes Coral the central piece of the application's reasoning layer.

## Safety Notes
By exposing the underlying SQL logic and joined rows, CareOps allows human caregivers and doctors to audit exactly where any piece of information in the packet came from, enhancing trust and clinical safety.
