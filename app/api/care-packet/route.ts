import { NextRequest, NextResponse } from "next/server";
import { getCarePacketJoinQuery, getPatientProfileQuery, getCurrentMedicinesQuery, getRecentLabsQuery, getDoctorInstructionsQuery, getSymptomTimelineQuery, getPharmacyRefillsQuery, getAppointmentQuery, getFamilyNotesQuery } from "@/lib/coral/careops-queries";
import { runCoralSourceList, runCoralSql } from "@/lib/coral/coral-cli-client";
import { parseCoralJsonResult, parseCoralSourceList } from "@/lib/coral/coral-output-parser";

const SAFETY_DISCLAIMER = "This is not medical advice. Please consult a licensed doctor. CareOps does not diagnose, prescribe medicine, or recommend medicine changes.";

function mapRows(columns: string[], rows: Record<string, string>[]) {
  return rows.map((row) => {
    const obj: Record<string, any> = {};
    columns.forEach((col) => (obj[col] = row[col]));
    return obj;
  });
}

export async function GET(request: NextRequest) {
  const patientId = request.nextUrl.searchParams.get("patientId") || "";
  const purpose = request.nextUrl.searchParams.get("purpose") || "diabetes follow-up";

  if (!patientId) {
    return NextResponse.json({ error: "patientId is required" }, { status: 400 });
  }
  if (!/^[a-zA-Z0-9_-]+$/.test(patientId)) {
    return NextResponse.json({ error: "Invalid patientId format" }, { status: 400 });
  }

  const commands: string[] = [];
  const errors: string[] = [];

  try {
    // Step 1: Source list
    const sourceListResult = await runCoralSourceList();
    commands.push(sourceListResult.command);
    const parsedSources = parseCoralSourceList(sourceListResult.stdout);
    const careOpsSources = parsedSources.sources.filter((s) => s.name.startsWith("careops_"));
    const sourcesUsed = careOpsSources.map((s) => s.name);

    // Step 2: Patient profile
    const profileSql = getPatientProfileQuery(patientId);
    const profileResp = await runCoralSql(profileSql, "json");
    commands.push(profileResp.command);
    const profileParsed = parseCoralJsonResult(profileResp.stdout);
    const patient = profileParsed.rows.length > 0 ? profileParsed.rows[0] : null;

    if (!patient) {
      return NextResponse.json({ error: `Patient ${patientId} not found` }, { status: 404 });
    }

    // Step 3: Run individual source queries
    const [medicinesResp, labsResp, instructionsResp, symptomsResp, refillsResp, appointmentsResp, notesResp] = await Promise.all([
      runCoralSql(getCurrentMedicinesQuery(patientId), "json"),
      runCoralSql(getRecentLabsQuery(patientId), "json"),
      runCoralSql(getDoctorInstructionsQuery(patientId), "json"),
      runCoralSql(getSymptomTimelineQuery(patientId), "json"),
      runCoralSql(getPharmacyRefillsQuery(patientId), "json"),
      runCoralSql(getAppointmentQuery(patientId), "json"),
      runCoralSql(getFamilyNotesQuery(patientId), "json"),
    ]);

    commands.push(medicinesResp.command, labsResp.command, instructionsResp.command, symptomsResp.command, refillsResp.command, appointmentsResp.command, notesResp.command);

    const currentMedicines = parseCoralJsonResult(medicinesResp.stdout);
    const recentLabs = parseCoralJsonResult(labsResp.stdout);
    const doctorInstructions = parseCoralJsonResult(instructionsResp.stdout);
    const symptomTimeline = parseCoralJsonResult(symptomsResp.stdout);
    const refillEvidence = parseCoralJsonResult(refillsResp.stdout);
    const appointments = parseCoralJsonResult(appointmentsResp.stdout);
    const familyNotes = parseCoralJsonResult(notesResp.stdout);

    // Step 4: Cross-source join query
    const joinSql = getCarePacketJoinQuery(patientId);
    const joinResp = await runCoralSql(joinSql, "json");
    commands.push(joinResp.command);
    const joinParsed = parseCoralJsonResult(joinResp.stdout);

    // Step 5: Collect raw output
    const rawCoralOutput = [
      `--- Source List ---\n${sourceListResult.stdout}`,
      `--- Profile ---\n${profileResp.stdout}`,
      `--- Medicines ---\n${medicinesResp.stdout}`,
      `--- Labs ---\n${labsResp.stdout}`,
      `--- Instructions ---\n${instructionsResp.stdout}`,
      `--- Symptoms ---\n${symptomsResp.stdout}`,
      `--- Refills ---\n${refillsResp.stdout}`,
      `--- Appointments ---\n${appointmentsResp.stdout}`,
      `--- Notes ---\n${notesResp.stdout}`,
      `--- Cross-Source Join ---\n${joinResp.stdout}`,
    ].join("\n");

    // Step 6: Detect missing records
    const missingRecords: string[] = [];
    if (recentLabs.rows.length === 0 || !recentLabs.rows.some((r: any) => (r.test_name || "").toLowerCase().includes("hba1c"))) {
      missingRecords.push("No recent HbA1c lab report found in connected sources.");
    }
    if (refillEvidence.rows.length === 0) {
      missingRecords.push("No pharmacy refill receipt evidence found.");
    }

    const allNotes = familyNotes.rows.map((r: any) => (r.note_text || "").toLowerCase()).join(" ");
    if (!allNotes.includes("bp") && !allNotes.includes("weight")) {
      missingRecords.push("Missing BP and weight records for this month.");
    }

    // Step 7: Questions for doctor
    const questionsForDoctor = [
      "Are the recent HbA1c and fasting glucose reports enough for this follow-up, or should any additional tests be brought?",
      "Symptoms were logged after the medicine change. Ask the doctor whether the timing may be relevant.",
      "Do the refill receipts and current medicine list match what the clinic expects the patient to be taking?",
      "Should BP and weight logs be recorded before the next follow-up?",
      "Are there any records the family should keep in one place before the next appointment?",
    ];

    // Step 8: Summary
    const summary = `${patient.name} is preparing for ${purpose}. CareOps joined medicines, labs, doctor chats, prescription OCR, receipts, symptoms, appointments, and family notes via coral sql to prepare a doctor-ready packet.`;

    return NextResponse.json({
      mode: "coral_cli",
      patientId,
      visitPurpose: purpose,
      commands,
      sourcesUsed,
      sql: joinSql,
      rawCoralOutput,
      joinedRows: mapRows(joinParsed.columns, joinParsed.rows),
      rowCount: joinParsed.rows.length,
      packet: {
        summary,
        patient,
        currentMedicines: mapRows(currentMedicines.columns, currentMedicines.rows),
        recentLabs: mapRows(recentLabs.columns, recentLabs.rows),
        symptomTimeline: mapRows(symptomTimeline.columns, symptomTimeline.rows),
        doctorInstructions: mapRows(doctorInstructions.columns, doctorInstructions.rows),
        refillEvidence: mapRows(refillEvidence.columns, refillEvidence.rows),
        appointments: mapRows(appointments.columns, appointments.rows),
        familyNotes: mapRows(familyNotes.columns, familyNotes.rows),
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
        mode: "coral_cli",
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
