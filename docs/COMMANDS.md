# CareOps Commands

All scripts can be run via `npm run <command>`.

| Command | Description |
|---|---|
| `npm run dev` | Starts the Next.js development server on port 3000. |
| `npm run build` | Builds the Next.js application for production. |
| `npm run start` | Starts the production server. |
| `npm run lint` | Runs ESLint to check for code issues. |
| `npm run test` | Runs the Vitest test suite. |
| `npm run test:watch` | Runs Vitest in watch mode for active development. |
| `npm run seed` | Parses `data/*.csv` files and generates `careops.db` SQLite database to act as the Mock Coral server. |
| `npm run export:packet` | Generates a Markdown Doctor Visit Packet and saves it to the `/exports` folder. (e.g. `npm run export:packet pat-001`) |

## GitHub Issue/PR Workflow Commands (Optional)
If you have the `gh` CLI installed:
- `gh issue create --title "Issue Name" --body "Issue Body"`
- `gh pr create -B main -H feature/branch --title "PR Title" --body "PR Body"`
