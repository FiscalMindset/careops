# CareOps Test Output

```bash
> careops-agent@0.1.0 test
> vitest run

 RUN  v2.1.9 /Volumes/algsoch/careops

 ✓ tests/careops.test.ts (7 tests) 195ms
   ✓ CareOps data loading > loads synthetic patients and care records
   ✓ Coral SQL query execution (Mock) > joins medication, symptoms, labs, chats, and refills using SQLite
   ✓ Patient timeline join > builds a timeline with multiple source types
   ✓ Packet generation > generates a diabetes follow-up packet
   ✓ Packet generation > detects missing BP and weight records for pat-003
   ✓ Packet generation > maintains safety guardrails
   ✓ Export generation > renders markdown with safety disclaimer and SQL

 Test Files  1 passed (1)
      Tests  7 passed (7)
   Start at  18:05:33
   Duration  2.05s
```

## Summary
- **Coverage**: Core data logic, Coral SQLite mock abstraction, packet synthesis logic, missing record triggers, and string-based safety guardrails.
- **Status**: 100% passing.
- **Execution**: Run locally using `npm run test`.
