# Contributing to CareOps

We welcome contributions! CareOps is a Coral-powered family care coordination agent built for the Coral Hackathon Track 2.

## Development Workflow

1. **Find or create a GitHub Issue**: Check [existing issues](https://github.com/FiscalMindset/careops/issues) or open a new one describing the feature or bug
2. **Branch**: Create a branch prefixed with `feature/` or `fix/`:
   ```bash
   git checkout -b feature/my-feature
   ```
3. **Develop**: Make changes following the guidelines below
4. **Test**: Run tests before committing
   ```bash
   npm run test        # Unit tests (vitest) — 16 tests
   npm run test:coral  # Coral integration tests
   npm run build       # Ensure production build passes
   ```
5. **Commit**: Write clear, descriptive commit messages
6. **Push and open a PR**: Push to your fork and open a pull request against `main`

## Coding Style

- **Framework**: Next.js 15 App Router + TypeScript
- **Styling**: Tailwind CSS — follow the "Clean Healthcare Aesthetic" (white background, black text, minimal accents)
- **Components**: Use shared components from `src/components/ui.tsx` where possible
- **No comments**: Aim for self-documenting code with expressive variable/function names
- **Avoid "dark cyberpunk" aesthetics**: Keep the UI clean, accessible, and professional

## Coral-First Architecture

CareOps uses **Coral CLI** as its default query engine. Keep these principles in mind:

- **Default mode is `coral_cli`**: All queries go through `coral sql --format json` via `coral-cli-client.ts`
- **SQLite/mock modes are fallback only**: Used for tests and offline development
- **Predefined query templates only**: SQL comes from `src/lib/coral/careops-queries.ts`, never from the browser
- **Table naming convention**: `careops_{source_name}.{table_name}` (not `_spec` suffixes)
- **Manifest convention**: `backend: jsonl` (NOT `file`), no `format` property, hardcoded absolute paths

## Safety Boundaries (CRITICAL)

CareOps is an organizational tool. It must never:

- **Infer a diagnosis** or prescribe medicine
- **Recommend medicine changes** (dose increases, discontinuation, etc.)
- **Make causal claims** between symptoms and medicines (use "symptom was logged after medicine change", NOT "medicine caused symptom")

Always include the safety disclaimer: *"This is not medical advice. Please consult a licensed doctor."*

## Adding a New Coral Source

1. **Create data**: Add a JSONL file in `data/` (e.g. `data/new_source.jsonl`)
2. **Create manifest**: Add `coral/sources/careops/{name}/manifest.yaml` following the existing pattern:
   - `backend: jsonl`
   - Hardcoded absolute path in `source.location`
   - Proper table columns (omit `format` property)
   - 2+ test queries
3. **Register**: `coral source add --file coral/sources/careops/{name}/manifest.yaml`
4. **Add query template**: Add a function in `src/lib/coral/careops-queries.ts`
5. **Update types**: Update `src/types/careops.ts` if new data types are needed
6. **Update data loader**: Update `src/lib/data/load-careops-data.ts` for static display
7. **Test**: `coral source test careops_{name}` then `npm run test`

## Adding an API Route

- New Coral-related routes go in `app/api/coral/`
- Use `runCoralSql()` / `runCoralSourceList()` / `runCoralSourceLint()` / `runCoralSourceAdd()` / `runCoralSourceTest()` from `coral-cli-client.ts`
- Validate patient IDs: only allow `[a-zA-Z0-9_-]+`
- Return `mode`, `command`, `rawOutput` in every response for Coral layer transparency

## PR Checklist

Before opening a PR:

- [ ] `npm run test` passes (all 16+ tests)
- [ ] `npm run build` succeeds
- [ ] `npm run test:coral` passes (if Coral sources changed)
- [ ] New functionality has test coverage
- [ ] TypeScript types are updated if data shapes changed
- [ ] Safety boundaries are respected (no diagnosis/prescription logic)
