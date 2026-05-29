# CareOps Commands

## npm Commands

All scripts can be run via `npm run <command>`.

| Command | Description |
|---------|-------------|
| `npm run dev` | Starts the Next.js development server on port 3000 |
| `npm run build` | Builds the Next.js application for production |
| `npm run start` | Starts the production server |
| `npm run lint` | Runs ESLint to check for code issues |
| `npm run test` | Runs the Vitest test suite (16 tests) |
| `npm run test:watch` | Runs Vitest in watch mode for active development |
| `npm run test:coral` | Runs Coral integration tests against real `coral sql` |
| `npm run seed` | Parses `data/*.csv` files and generates `careops.db` SQLite database (fallback mode only) |
| `npm run export:packet` | Generates a Markdown Doctor Visit Packet and saves it to `/exports` folder (e.g. `npm run export:packet pat-001`) |

## Coral CLI Commands

These are executed by the app but can also be run manually:

| Command | Description |
|---------|-------------|
| `coral source lint <manifest.yaml>` | Validate a source manifest schema |
| `coral source add --file <manifest.yaml>` | Register a source with Coral |
| `coral source test <source_name>` | Run declared test_queries against a registered source |
| `coral source list` | List all registered sources |
| `coral sql --format json "<query>"` | Execute SQL query and return JSON results |
| `coral sql "<query>"` | Execute SQL query and return table-formatted results |

## GitHub Issue/PR Workflow

If you have the `gh` CLI installed:

```bash
gh issue create --title "Issue Name" --body "Issue Body"
gh pr create -B main -H feature/branch --title "PR Title" --body "PR Body"
```
