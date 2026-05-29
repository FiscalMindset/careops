process.env.NEXT_PUBLIC_USE_MOCK_CORAL = process.env.NEXT_PUBLIC_USE_MOCK_CORAL || "true";
process.env.DATABASE_URL = process.env.DATABASE_URL || "file:./careops.db";
import { generateDoctorVisitPacket } from "../src/lib/agent/careops-agent";
import { writePacketMarkdown } from "../src/lib/export/markdown";

const patientId = process.argv[2] ?? "pat-001";
const purpose = process.argv.slice(3).join(" ") || "diabetes follow-up";

async function main() {
  const packet = await generateDoctorVisitPacket(patientId, purpose);
  const result = await writePacketMarkdown(packet);

  console.log(`Exported ${result.fileName}`);
  console.log(result.exportPath);
}

main().catch(console.error);
