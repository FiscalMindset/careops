import { NextRequest, NextResponse } from "next/server";
import { loadCareOpsData } from "@/lib/data/load-careops-data";
import { CoralClient } from "@/lib/coral/client";
import type { QueryMode } from "@/lib/coral/client";
import {
  getPatientProfileQuery,
  getCurrentMedicinesQuery,
  getRecentLabsQuery,
  getDoctorInstructionsQuery,
  getSymptomTimelineQuery,
  getPharmacyRefillsQuery,
  getAppointmentQuery,
  getFamilyNotesQuery,
  getCarePacketJoinQuery,
} from "@/lib/coral/careops-queries";

async function getDatasetStats() {
  const data = await loadCareOpsData();
  return {
    totalRows: {
      patients: data.patients.length,
      medications: data.medications.length,
      labReports: data.labReports.length,
      doctorChats: data.doctorChats.length,
      pharmacyReceipts: data.pharmacyReceipts.length,
      symptomLogs: data.symptomLogs.length,
      appointments: data.appointments.length,
      prescriptionOcr: data.prescriptionOcr.length,
      familyNotes: data.familyNotes.length,
    },
    total:
      data.patients.length +
      data.medications.length +
      data.labReports.length +
      data.doctorChats.length +
      data.pharmacyReceipts.length +
      data.symptomLogs.length +
      data.appointments.length +
      data.prescriptionOcr.length +
      data.familyNotes.length,
  };
}

function extractRows(resp: { result: { columns: string[]; rows: any[][] } | null }): Record<string, any>[] {
  if (!resp.result) return [];
  return resp.result.rows.map((row) => {
    const obj: Record<string, any> = {};
    resp.result!.columns.forEach((col, i) => (obj[col] = row[i]));
    return obj;
  });
}

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q") || "";
  const patientId = request.nextUrl.searchParams.get("patientId") || "pat-001";
  const modeParam = request.nextUrl.searchParams.get("mode") as QueryMode | null;

  if (!/^[a-zA-Z0-9_-]+$/.test(patientId)) {
    return NextResponse.json({ error: "Invalid patientId format" }, { status: 400 });
  }

  const commands: string[] = [];

  try {
    const t0 = performance.now();
    const coral = new CoralClient(modeParam ? { mode: modeParam } : undefined);
    const mode = coral.executionMode;

    const profileResp = await coral.executeQuery(getPatientProfileQuery(patientId));
    commands.push(profileResp.meta.command);
    const patientRows = extractRows(profileResp);
    const patient = patientRows.length > 0 ? patientRows[0] : null;

    const [medicinesResp, labsResp, instructionsResp, symptomsResp, refillsResp, appointmentsResp, notesResp] =
      await Promise.all([
        coral.executeQuery(getCurrentMedicinesQuery(patientId)),
        coral.executeQuery(getRecentLabsQuery(patientId)),
        coral.executeQuery(getDoctorInstructionsQuery(patientId)),
        coral.executeQuery(getSymptomTimelineQuery(patientId)),
        coral.executeQuery(getPharmacyRefillsQuery(patientId)),
        coral.executeQuery(getAppointmentQuery(patientId)),
        coral.executeQuery(getFamilyNotesQuery(patientId)),
      ]);

    commands.push(
      medicinesResp.meta.command,
      labsResp.meta.command,
      instructionsResp.meta.command,
      symptomsResp.meta.command,
      refillsResp.meta.command,
      appointmentsResp.meta.command,
      notesResp.meta.command
    );

    const currentMedicines = extractRows(medicinesResp);
    const recentLabs = extractRows(labsResp);
    const doctorInstructions = extractRows(instructionsResp);
    const symptomTimeline = extractRows(symptomsResp);
    const refillEvidence = extractRows(refillsResp);
    const appointments = extractRows(appointmentsResp);
    const familyNotes = extractRows(notesResp);

    const joinSql = getCarePacketJoinQuery(patientId);
    const joinResp = await coral.executeQuery(joinSql);
    commands.push(joinResp.meta.command);
    const joinedRows = extractRows(joinResp);

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

    const questionsForDoctor = [
      "Are the recent HbA1c and fasting glucose reports enough for this follow-up, or should any additional tests be brought?",
      "Symptoms were logged after the medicine change. Ask the doctor whether the timing may be relevant.",
      "Do the refill receipts and current medicine list match what the clinic expects the patient to be taking?",
      "Should BP and weight logs be recorded before the next follow-up?",
      "Are there any records the family should keep in one place before the next appointment?",
    ];

    const summary = patient
      ? `${patient.name} is preparing for ${q || "a visit"}. CareOps joined medicines, labs, doctor chats, prescription OCR, receipts, symptoms, appointments, and family notes via coral sql to prepare a doctor-ready packet.`
      : "";

    const datasetStats = await getDatasetStats();
    const t1 = performance.now();

    return NextResponse.json({
      mode,
      query: q || "diabetes follow-up",
      patientId,
      patient,
      commands,
      sql: joinSql,
      rowCount: joinedRows.length,
      executionTimeMs: Math.round(t1 - t0),
      datasetStats,
      rows: joinedRows.slice(0, 50),
      currentMedicines,
      recentLabs,
      symptomTimeline,
      doctorInstructions,
      refillEvidence,
      appointments,
      familyNotes,
      missingRecords,
      questionsForDoctor,
      summary,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const datasetStats = await getDatasetStats();
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Query failed",
        query: q,
        patientId,
        rowCount: 0,
        executionTimeMs: 0,
        datasetStats,
        rows: [],
        currentMedicines: [],
        recentLabs: [],
        symptomTimeline: [],
        doctorInstructions: [],
        refillEvidence: [],
        appointments: [],
        familyNotes: [],
        missingRecords: [],
        questionsForDoctor: [],
        summary: "",
      },
      { status: 500 }
    );
  }
}
