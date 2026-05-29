import { NextRequest, NextResponse } from "next/server";
import { getCarePacketJoinQuery, getPatientProfileQuery, getCurrentMedicinesQuery, getRecentLabsQuery, getDoctorInstructionsQuery, getSymptomTimelineQuery, getPharmacyRefillsQuery, getAppointmentQuery, getFamilyNotesQuery } from "@/lib/coral/careops-queries";
import { CoralClient } from "@/lib/coral/client";
import type { QueryMode } from "@/lib/coral/client";

const SAFETY_DISCLAIMER = "This is not medical advice. Please consult a licensed doctor. CareOps does not diagnose, prescribe medicine, or recommend medicine changes.";

function extractRows(resp: { result: { columns: string[]; rows: any[][] } | null }): Record<string, any>[] {
  if (!resp.result) return [];
  return resp.result.rows.map((row) => {
    const obj: Record<string, any> = {};
    resp.result!.columns.forEach((col, i) => (obj[col] = row[i]));
    return obj;
  });
}

const SOURCES_LIST = [
  "careops_patients", "careops_medications", "careops_lab_reports",
  "careops_doctor_chats", "careops_pharmacy_receipts", "careops_symptom_logs",
  "careops_appointments", "careops_prescription_ocr", "careops_family_notes",
];

export async function GET(request: NextRequest) {
  const patientId = request.nextUrl.searchParams.get("patientId") || "";
  const purpose = request.nextUrl.searchParams.get("purpose") || "diabetes follow-up";
  const modeParam = request.nextUrl.searchParams.get("mode") as QueryMode | null;

  if (!patientId) {
    return NextResponse.json({ error: "patientId is required" }, { status: 400 });
  }
  if (!/^[a-zA-Z0-9_-]+$/.test(patientId)) {
    return NextResponse.json({ error: "Invalid patientId format" }, { status: 400 });
  }

  const commands: string[] = [];
  const errors: string[] = [];

  try {
    const coral = new CoralClient(modeParam ? { mode: modeParam } : undefined);
    const mode = coral.executionMode;

    // Step 1: Patient profile
    const profileResp = await coral.executeQuery(getPatientProfileQuery(patientId));
    commands.push(profileResp.meta.command);
    const patientRows = extractRows(profileResp);
    const patient = patientRows.length > 0 ? patientRows[0] : null;

    if (!patient) {
      return NextResponse.json({ error: `Patient ${patientId} not found` }, { status: 404 });
    }

    // Step 2: Run individual source queries
    const [medicinesResp, labsResp, instructionsResp, symptomsResp, refillsResp, appointmentsResp, notesResp] = await Promise.all([
      coral.executeQuery(getCurrentMedicinesQuery(patientId)),
      coral.executeQuery(getRecentLabsQuery(patientId)),
      coral.executeQuery(getDoctorInstructionsQuery(patientId)),
      coral.executeQuery(getSymptomTimelineQuery(patientId)),
      coral.executeQuery(getPharmacyRefillsQuery(patientId)),
      coral.executeQuery(getAppointmentQuery(patientId)),
      coral.executeQuery(getFamilyNotesQuery(patientId)),
    ]);

    commands.push(medicinesResp.meta.command, labsResp.meta.command, instructionsResp.meta.command, symptomsResp.meta.command, refillsResp.meta.command, appointmentsResp.meta.command, notesResp.meta.command);

    const currentMedicines = extractRows(medicinesResp);
    const recentLabs = extractRows(labsResp);
    const doctorInstructions = extractRows(instructionsResp);
    const symptomTimeline = extractRows(symptomsResp);
    const refillEvidence = extractRows(refillsResp);
    const appointments = extractRows(appointmentsResp);
    const familyNotes = extractRows(notesResp);

    // Step 3: Cross-source join query
    const joinSql = getCarePacketJoinQuery(patientId);
    const joinResp = await coral.executeQuery(joinSql);
    commands.push(joinResp.meta.command);
    const joinedRows = extractRows(joinResp);

    // Step 4: Collect raw output
    const rawCoralOutput = [
      `--- Profile ---\n${profileResp.meta.rawOutput}`,
      `--- Medicines ---\n${medicinesResp.meta.rawOutput}`,
      `--- Labs ---\n${labsResp.meta.rawOutput}`,
      `--- Instructions ---\n${instructionsResp.meta.rawOutput}`,
      `--- Symptoms ---\n${symptomsResp.meta.rawOutput}`,
      `--- Refills ---\n${refillsResp.meta.rawOutput}`,
      `--- Appointments ---\n${appointmentsResp.meta.rawOutput}`,
      `--- Notes ---\n${notesResp.meta.rawOutput}`,
      `--- Cross-Source Join ---\n${joinResp.meta.rawOutput}`,
    ].join("\n");

    // Step 5: Detect missing records
    const missingRecords: string[] = [];
    if (recentLabs.length === 0 || !recentLabs.some((r: any) => (r.test_name || "").toLowerCase().includes("hba1c"))) {
      missingRecords.push("No recent HbA1c lab report found in connected sources.");
    }
    if (refillEvidence.length === 0) {
      missingRecords.push("No pharmacy refill receipt evidence found.");
    }
    const allNotes = familyNotes.map((r: any) => (r.note_text || "").toLowerCase()).join(" ");
    if (!allNotes.includes("bp") && !allNotes.includes("weight")) {
      missingRecords.push("Missing BP and weight records for this month.");
    }

    // Step 6: Questions for doctor
    const questionsForDoctor = [
      "Are the recent HbA1c and fasting glucose reports enough for this follow-up, or should any additional tests be brought?",
      "Symptoms were logged after the medicine change. Ask the doctor whether the timing may be relevant.",
      "Do the refill receipts and current medicine list match what the clinic expects the patient to be taking?",
      "Should BP and weight logs be recorded before the next follow-up?",
      "Are there any records the family should keep in one place before the next appointment?",
    ];

    // Step 7: Summary
    const summary = `${patient.name} is preparing for ${purpose}. CareOps joined medicines, labs, doctor chats, prescription OCR, receipts, symptoms, appointments, and family notes via coral sql to prepare a doctor-ready packet.`;

    return NextResponse.json({
      mode,
      patientId,
      visitPurpose: purpose,
      commands,
      sourcesUsed: SOURCES_LIST,
      sql: joinSql,
      rawCoralOutput,
      joinedRows,
      rowCount: joinedRows.length,
      packet: {
        summary,
        patient,
        currentMedicines,
        recentLabs,
        symptomTimeline,
        doctorInstructions,
        refillEvidence,
        appointments,
        familyNotes,
        missingRecords,
        questionsForDoctor,
        safetyNotice: SAFETY_DISCLAIMER,
      },
      errors,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        mode: modeParam || "coral_cli",
        error: `Coral execution failed: ${error.message}`,
        commands,
        sourcesUsed: [],
        sql: "",
        rawCoralOutput: "",
        joinedRows: [],
        rowCount: 0,
        packet: null,
        errors: [error.message],
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
