import type { DoctorVisitPacket, JoinedEvidenceRow } from "@/types/careops";
import { getPatientDataset } from "@/lib/data/load-careops-data";
import { CoralClient } from "@/lib/coral/client";
import {
  getCarePacketJoinQuery,
  getCurrentMedicinesQuery,
  getRecentLabsQuery,
  getDoctorInstructionsQuery,
  getSymptomTimelineQuery,
  getPharmacyRefillsQuery,
} from "@/lib/coral/careops-queries";

export const SAFETY_DISCLAIMER =
  "This is not medical advice. Please consult a licensed doctor. CareOps does not diagnose, prescribe medicine, or recommend medicine changes.";

function extractRows(resp: { result: { columns: string[]; rows: any[][] } | null }): Record<string, any>[] {
  if (!resp.result) return [];
  return resp.result.rows.map((row) => {
    const obj: Record<string, any> = {};
    resp.result!.columns.forEach((col, i) => (obj[col] = row[i]));
    return obj;
  });
}

export async function generateDoctorVisitPacket(patientId: string, visitPurpose: string): Promise<DoctorVisitPacket> {
  const patientData = await getPatientDataset(patientId);
  if (!patientData.patient) {
    throw new Error(`No synthetic patient found for id ${patientId}`);
  }

  const coral = new CoralClient();
  let evidenceRows: JoinedEvidenceRow[] = [];
  try {
    const resp = await coral.executeQuery(getCarePacketJoinQuery(patientId));
    if (resp.result) {
      evidenceRows = resp.result.rows.map((rowArray: any[]) => {
        const obj: Record<string, any> = {};
        resp.result!.columns.forEach((col: string, i: number) => (obj[col] = rowArray[i]));
        obj.confidence = "high";
        return obj as JoinedEvidenceRow;
      });
    }
  } catch (err) {
    console.error("Failed to run coral query", err);
  }

  const currentMedicines = patientData.medications.filter((medication) => !medication.end_date);
  const medicineChanges = patientData.doctorChats.filter((chat) => chat.instruction_type === "medicine_change");
  const recentLabs = patientData.labReports
    .slice()
    .sort((a, b) => b.report_date.localeCompare(a.report_date))
    .slice(0, 5);
  const upcomingAppointment = patientData.appointments
    .filter((appointment) => appointment.status === "scheduled")
    .sort((a, b) => a.appointment_date.localeCompare(b.appointment_date))[0];
  const missingRecords = detectMissingRecords(patientData);

  const questions = [
    "Are the recent HbA1c and fasting glucose reports enough for this follow-up, or should any additional tests be brought?",
    "Symptoms were logged after the medicine change. Ask the doctor whether the timing may be relevant.",
    "Do the refill receipts and current medicine list match what the clinic expects the patient to be taking?",
    "Should BP and weight logs be recorded before the next follow-up?",
    "Are there any records the family should keep in one place before the next appointment?",
  ];

  const sources = [
    "careops_patients",
    "careops_medications",
    "careops_lab_reports",
    "careops_doctor_chats",
    "careops_pharmacy_receipts",
    "careops_symptom_logs",
    "careops_appointments",
    "careops_prescription_ocr",
    "careops_family_notes",
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
    timeline: [],
    evidenceRows,
    sql: getCarePacketJoinQuery(patientId),
    sourcesUsed: sources,
    safetyDisclaimer: SAFETY_DISCLAIMER,
  };
}

function detectMissingRecords(patientData: Awaited<ReturnType<typeof getPatientDataset>>): string[] {
  const notes = patientData.familyNotes.map((note) => note.note_text.toLowerCase()).join(" ");
  const missing: string[] = [];

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
  const unsafePhrases = [
    "you should stop",
    "increase the dose",
    "decrease the dose",
    "diagnosis is",
    "caused by sitagliptin",
  ];
  return !unsafePhrases.some((phrase) => text.toLowerCase().includes(phrase));
}
