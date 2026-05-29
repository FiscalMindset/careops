import fs from "node:fs/promises";
import path from "node:path";
import type { DoctorVisitPacket } from "@/types/careops";

export function packetToMarkdown(packet: DoctorVisitPacket) {
  return `# Doctor Visit Packet: ${packet.patient.name}

**Patient ID:** ${packet.patient.patient_id}  
**Age:** ${packet.patient.age}  
**Visit purpose:** ${packet.visitPurpose}  
**Generated:** ${packet.generatedAt}

> ${packet.safetyDisclaimer}

## Summary

${packet.summary}

## Current Medicines

${packet.currentMedicines.map((med) => `- ${med.medicine_name} ${med.dose}, ${med.frequency}. Source: ${med.source}.`).join("\n")}

## Medicine Changes Since Last Visit

${packet.medicineChanges.map((chat) => `- ${chat.date}: ${chat.message}`).join("\n")}

## Recent Labs

${packet.recentLabs.map((lab) => `- ${lab.report_date}: ${lab.test_name} ${lab.value}${lab.unit} (${lab.lab_name})`).join("\n")}

## Symptoms After Medicine Changes

${packet.symptomTimeline.map((symptom) => `- ${symptom.date}: ${symptom.symptom}, severity ${symptom.severity}/5. ${symptom.notes}`).join("\n")}

## Refill Evidence

${packet.refillEvidence.map((receipt) => `- ${receipt.date}: ${receipt.medicine}, ${receipt.quantity}, ${receipt.pharmacy}.`).join("\n")}

## Upcoming Appointment

${packet.upcomingAppointment ? `- ${packet.upcomingAppointment.appointment_date}: ${packet.upcomingAppointment.reason} with ${packet.upcomingAppointment.doctor} (${packet.upcomingAppointment.speciality})` : "- No upcoming appointment found."}

## Missing Records

${packet.missingRecords.map((item) => `- ${item}`).join("\n") || "- No missing records detected by current rules."}

## Questions To Ask Doctor

${packet.questions.map((question) => `- ${question}`).join("\n")}

## Coral SQL Evidence

CareOps used Coral as the central cross-source query layer because this answer requires joining multiple sources.

\`\`\`sql
${packet.sql}
\`\`\`

Sources used: ${packet.sourcesUsed.join(", ")}
`;
}

export async function writePacketMarkdown(packet: DoctorVisitPacket) {
  const slug = `${packet.patient.patient_id}-${packet.visitPurpose.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`.replace(/-$/, "");
  const fileName = `${slug}.md`;
  const exportPath = path.join(process.cwd(), "exports", fileName);
  await fs.mkdir(path.dirname(exportPath), { recursive: true });
  await fs.writeFile(exportPath, packetToMarkdown(packet), "utf8");
  return { fileName, exportPath };
}
