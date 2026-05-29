# Contributing to CareOps

We welcome contributions to expand CareOps! Please adhere to the following workflow to ensure quality and safety.

## PR Workflow
1. **Find or create an Issue**: Ensure an issue exists in GitHub (or `docs/ISSUES.md` locally) describing the feature.
2. **Branch**: Create a branch prefixed with `feature/` or `fix/`. E.g., `git checkout -b feature/new-source-spec`.
3. **Commit**: Write clear, descriptive commit messages.
4. **Test**: Run `npm run test` and `npm run lint` before opening a PR.
5. **PR Template**: If GitHub is not used, write a markdown file under `docs/prs/` following the format: Summary, Files Changed, Tests Run, Coral Relevance, Safety Notes.

## Coding Style
- We strictly adhere to the Next.js App Router paradigm.
- UI elements must align with the "Clean Healthcare Aesthetic" (white background, black text, minimal accents). 
- Avoid "dark cyberpunk" aesthetics.
- Use `shadcn/ui` or our custom standard components in `src/components/ui.tsx`.

## Safety Boundaries (CRITICAL)
- CareOps is an organizational tool.
- **Never write code that infers a diagnosis or prescribes medicine.**
- Only present facts and logs.
- Use phrases like "Symptom was logged after medicine change," NOT "Medicine caused symptom."

## Adding a New Source Spec
1. Ensure the source data can be modeled safely.
2. Add a CSV file to `/data`.
3. Update `src/lib/data/load-careops-data.ts`.
4. Update `scripts/seed.ts` to create the mock table (`careops_NEW_SPEC_spec`).
5. Document the spec in `docs/SPECS.md`.
6. Update the `DOCTOR_VISIT_PACKET_QUERY` in `src/lib/coral/queries.ts` to `LEFT JOIN` the new spec on `patient_id`.
