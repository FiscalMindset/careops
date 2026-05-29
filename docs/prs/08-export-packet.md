# PR: Export Markdown Packet

## Summary
Implemented functionality to export the generated Doctor Visit Packet to a downloadable, easily shareable Markdown file.

## Files Changed
- `scripts/export-packet.ts`: A CLI script to generate and save a packet locally for any patient.
- `src/lib/export/markdown.ts`: Contains the logic to format the `DoctorVisitPacket` JSON into a beautifully structured Markdown document.
- `app/api/export/route.ts`: A Next.js API route that generates the packet and returns it as a downloadable `.md` file, which is linked to the "Export markdown" button in the UI.

## Tests Run
- Successfully executed `npm run export:packet pat-001`.
- Verified the generated file in the `/exports` directory contains all sections: Medicines, Labs, Instructions, Missing Records, Questions, and the critical Safety Disclaimer.

## Coral Relevance
The exported document represents the final artifact of the Coral cross-source join. It proves that by using Coral, we can take highly fragmented healthcare data from 9 specs and distill it into one offline-ready document that a patient can physically hand to their doctor.

## Safety Notes
The Markdown export firmly includes the `SAFETY_DISCLAIMER` at the very top of the document. The language remains neutral and purely organizational, avoiding any medical claims.
