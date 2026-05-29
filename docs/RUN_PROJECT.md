# Running CareOps Agent

## Prerequisites

- Node.js 18+
- npm
- Coral CLI v0.2.0+ (`npm install -g @withcoral/cli`)

## Quick Start (Coral CLI Mode — Default)

```bash
# 1. Install dependencies
npm install

# 2. Register all 9 Coral sources
for f in coral/sources/careops/*/manifest.yaml; do
  coral source add --file "$f"
done

# 3. Start the dev server
npm run dev

# 4. Open http://localhost:3000
```

## SQLite Fallback Mode

```bash
# 1. Seed the database
npm run seed

# 2. Start with SQLite engine
CAREOPS_QUERY_MODE=sqlite npm run dev
```

Environment is configured via `.env.local` (auto-loaded by Next.js):
```
CAREOPS_QUERY_MODE=coral_cli
CORAL_CLI_PATH=/opt/homebrew/bin/coral
```

## Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Next.js dev server (Coral CLI mode by default) |
| `npm run build` | Build for production |
| `npm run test` | Run Vitest test suite (16 tests) |
| `npm run test:coral` | Run Coral integration tests against real `coral sql` |
| `npm run seed` | Seed SQLite database from CSVs (fallback mode only) |
| `npm run export:packet` | Generate markdown export |
| `npm run lint` | Lint code |

## Demo Workflow

1. **`/data-sources`**: Click Lint → Add → Test → Query on any source to see real Coral CLI in action
2. **`/evidence`**: Click "Verify Coral Sources" → "Run Live Coral Query" → "Generate Packet from Coral"
3. **`/packet`**: Generate a full doctor visit packet with timeline, evidence, and missing record detection
4. **`/timeline`**: View a chronological timeline across 7 Coral sources

## Troubleshooting

- **"Coral CLI not available"**: Ensure Coral CLI is installed (`npm install -g @withcoral/cli`) and `CORAL_CLI_PATH` is set correctly
- **"No timeline events found"**: Run `coral source list` to verify sources are registered. If not, run the registration commands from Quick Start
- **Tests fail on macOS**: Delete any `._` files: `find . -name '._*' -delete`
- **Build errors**: Delete `.next` and rebuild: `rm -rf .next && npm run build`
