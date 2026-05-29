# Environment Variables & Configuration

CareOps is designed to run **without paid API keys**. The default mode uses the real Coral CLI with JSONL data files — zero external services required.

## Required Configuration

| Env Var | Default | Description |
|---------|---------|-------------|
| `CAREOPS_QUERY_MODE` | `coral_cli` | Query engine mode: `coral_cli`, `sqlite`, or `mock` |
| `CORAL_CLI_PATH` | `coral` | Path to the Coral CLI binary |

Set these in `.env.local` (auto-loaded by Next.js):

```
CAREOPS_QUERY_MODE=coral_cli
CORAL_CLI_PATH=/opt/homebrew/bin/coral
```

## No API Keys Required

CareOps does NOT require any of the following:
- OpenAI API key
- Anthropic API key
- Groq API key
- Coral MCP server URL
- Any LLM provider key

The app runs fully offline using:
- **Real Coral CLI** + **JSONL data files** for the default mode
- **SQLite** database (seeded from CSVs) for fallback mode

## Keeping Keys Safe

- `docs/API_KEYS.md` and `.env.example` should only ever contain placeholder values
- `.env.local` is explicitly ignored in `.gitignore`
- If a secret is leaked, immediately roll the key in the respective provider dashboard
