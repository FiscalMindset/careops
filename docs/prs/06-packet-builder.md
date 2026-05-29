# PR: Doctor Visit Packet Builder

## Summary
Implemented the core CareOps agent logic to aggregate a patient's fragmented data and synthesize a cohesive "Doctor Visit Packet."

## Files Changed
- `src/lib/agent/careops-agent.ts`: Updated `generateDoctorVisitPacket` to integrate with `CoralClient` to fetch cross-source SQL evidence rows. It intelligently formulates safety-conscious questions for the doctor (e.g., "Symptoms were logged after medicine change. Ask the doctor whether the timing may be relevant" instead of diagnosing the cause).
- `app/packet/page.tsx`: Renders the generated packet UI (medicines, labs, symptoms, questions, etc.) using clean Tailwind/shadcn-style cards and missing record alerts.

## Tests Run
- Successfully loads patient `pat-001` (diabetes follow-up) and renders the full packet.

## Coral Relevance
The packet explicitly logs the sources it used (the 9 custom Coral specs) and executes the massive `DOCTOR_VISIT_PACKET_QUERY` cross-source join, pushing the result set as evidence alongside the final packet.

## Safety Notes
Strict adherence to safety rules:
- Prominently displays the `SAFETY_DISCLAIMER` in the UI warning that CareOps does not diagnose.
- The `assertSafetyBoundary` function prevents unsafe phrasing.
- Generated questions are structured as prompts for the human doctor to review rather than assertions of medical facts.
