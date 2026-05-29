# PR: Custom Care Source Specs

## Summary
Documented the custom Coral specs designed for the CareOps Agent. This provides clear schemas and instructions on how the unified healthcare data layer is modeled using Coral.

## Files Changed
- `docs/SPECS.md`: Added detailed schema definitions, example queries, and instructions on how to add future real sources.
- `coral/specs/README.md`: Created a placeholder directory and README to explain where Coral specs are documented and managed for the hackathon project.

## Tests Run
- Verified documentation renders correctly in markdown preview.

## Coral Relevance
By defining explicit schemas for 9 distinct healthcare entities (patients, medications, labs, symptoms, etc.), we prove the necessity of Coral. Coral is essential here because these sources typically live in silos, and our agent needs them joined contextually to generate a safe doctor-visit packet.

## Safety Notes
Documentation explicitly states these are local mock schemas and not real EMR production endpoints.
