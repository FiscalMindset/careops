import type { DoctorVisitPacket } from "@/types/careops";
import { getPatientDataset } from "@/lib/data/load-careops-data";
import { CoralClient } from "@/lib/coral/client";
import { DOCTOR_VISIT_PACKET_QUERY } from "@/lib/coral/queries";

export const SAFETY_DISCLAIMER =
  "This is not medical advice. Please consult a licensed doctor. CareOps does not diagnose, prescribe medicine, or recommend medicine changes.";

export async function generateDoctorVisitPacket(patientId: string, visitPurpose: string): Promise<DoctorVisitPacket> {
  const patientData = await getPatientDataset(patientId);
  if (!patientData.patient) {
    throw new Error(`No synthetic patient found for id ${patientId}`);
  }

  // Use Coral Client for cross-source join evidence
  const coral = new CoralClient();
  let coralResult;
  let evidenceRows: Record<string, any>[] = [];
  try {
    coralResult = await coral.executeQuery(DOCTOR_VISIT_PACKET_QUERY, [patientId]);
    evidenceRows = coralResult.rows.map(rowArray => {
      const obj: Record<string, any> = {};
      coralResult.columns.forEach((col: string, i: number) => obj[col] = rowArray[i]);
      obj.confidence = "high"; // mock confidence
      return obj;
    });
  } catch (err) {
    console.error("Failed to run coral query", err);
  }

  const currentMedicines = patientData.medications.filter((medication) => !medication.end_date);
  const medicineChanges = patientData.doctorChats.filter((chat) => chat.instruction_type === "medicine_change");
  const recentLabs = patientData.labReports.slice().sort((a, b) => b.report_date.localeCompare(a.report_date)).slice(0, 5);
  const upcomingAppointment = patientData.appointments
    .filter((appointment) => appointment.status === "scheduled")
    .sort((a, b) => a.appointment_date.localeCompare(b.appointment_date))[0];
  const missingRecords = detectMissingRecords(patientData);

  const questions = [
    "Are the recent HbA1c and fasting glucose reports enough for this follow-up, or should any additional tests be brought?",
    "Symptoms were logged after the medicine change. Ask the doctor whether the timing may be relevant.",
    "Do the refill receipts and current medicine list match what the clinic expects the patient to be taking?",
    "Should BP and weight logs be recorded before the next follow-up?",
    "Are there any records the family should keep in one place before the next appointment?"
  ];

  return {
    patient: patientData.patient,
    visitPurpose,
    generatedAt: new Date().toISOString(),
    summary: `${patientData.patient.name} is preparing for ${visitPurpose}. CareOps joined medicines, labs, doctor chats, prescription OCR, receipts, symptoms, appointments, and family notes to prepare a doctor-ready packet.`,
    currentMedicines,
    medicineChanges,
    recentLabs,
    symptomTimeline: patientData.symptomLogs.sort((a, b) => b.date.localeCompare(a.date)),
    doctorInstructions: patientData.doctorChats.sort((a, b) => b.date.localeCompare(a.date)),
    refillEvidence: patientData.pharmacyReceipts.sort((a, b) => b.date.localeCompare(a.date)),
    upcomingAppointment,
    missingRecords,
    questions,
    timeline: [], // Handled separately in timeline view
    evidenceRows,
    sql: DOCTOR_VISIT_PACKET_QUERY,
    sourcesUsed: [
      "careops_patients_spec",
      "careops_medications_spec",
      "careops_lab_reports_spec",
      "careops_doctor_chats_spec",
      "careops_pharmacy_receipts_spec",
      "careops_symptom_logs_spec",
      "careops_appointments_spec",
      "careops_prescription_ocr_spec",
      "careops_family_notes_spec"
    ],
    safetyDisclaimer: SAFETY_DISCLAIMER
  };
}

function detectMissingRecords(patientData: Awaited<ReturnType<typeof getPatientDataset>>): string[] {
  const notes = patientData.familyNotes.map((note) => note.note_text.toLowerCase()).join(" ");
  const missing = [];

  if (!notes.includes("bp") || !notes.includes("weight")) {
    missing.push("Missing BP and weight records for this month.");
  }

  if (!patientData.labReports.some((lab) => lab.test_name.toLowerCase().includes("hba1c"))) {
    missing.push("No recent HbA1c lab report found in connected sources.");
  }

  if (!patientData.pharmacyReceipts.length) {
    missing.push("No pharmacy refill receipt evidence found.");
  }

  return missing;
}

export function assertSafetyBoundary(text: string) {
  const unsafePhrases = ["you should stop", "increase the dose", "decrease the dose", "diagnosis is", "caused by sitagliptin"];
  return !unsafePhrases.some((phrase) => text.toLowerCase().includes(phrase));
}
