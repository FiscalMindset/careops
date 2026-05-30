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

const SAFETY_SYSTEM_PROMPT =
  "You are CareOps Agent, a clinical data assistant. " +
  "Summarize patient records and answer questions based ONLY on the data provided. " +
  "Never diagnose, prescribe medicine, recommend medicine changes, or give medical advice. " +
  "Always include: 'Please consult a doctor for medical decisions.' " +
  "Be concise, factual, and use plain language. " +
  "If the data doesn't contain information needed to answer the question, say so clearly.";

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

function escapeSql(val: string): string {
  return val.replace(/'/g, "''");
}

function formatList(items: any[], fields: string[], separator = "\n"): string {
  if (!items.length) return "(none recorded)";
  return items
    .map((item) => {
      return fields.map((f) => `${f}: ${item[f] ?? "—"}`).join(", ");
    })
    .join(separator);
}

function buildPrompt(
  patient: Record<string, any> | null,
  medicines: any[],
  labs: any[],
  symptoms: any[],
  instructions: any[],
  appointments: any[],
  notes: any[],
  refills: any[],
  question: string,
): string {
  const sections: string[] = [];

  if (patient) {
    sections.push(
      `PATIENT\nName: ${patient.name}\nAge: ${patient.age}\nGender: ${patient.gender}\nCondition: ${patient.condition_focus}\nDoctor: ${patient.primary_doctor}`,
    );
  }

  sections.push(
    `\nCURRENT MEDICATIONS\n${formatList(medicines, ["medicine_name", "dose", "frequency", "start_date"])}`,
  );

  sections.push(
    `\nRECENT LABS\n${formatList(labs, ["test_name", "value", "unit", "reference_range", "report_date"])}`,
  );

  sections.push(
    `\nSYMPTOM LOG\n${formatList(symptoms, ["date", "symptom", "severity", "notes"])}`,
  );

  sections.push(
    `\nDOCTOR INSTRUCTIONS\n${formatList(instructions, ["date", "doctor", "message", "instruction_type"])}`,
  );

  sections.push(
    `\nAPPOINTMENTS\n${formatList(appointments, ["appointment_date", "doctor", "speciality", "reason", "status"])}`,
  );

  if (notes.length) {
    sections.push(`\nFAMILY NOTES\n${formatList(notes, ["date", "note_author", "note_text", "priority"])}`);
  }

  if (refills.length) {
    sections.push(`\nPHARMACY REFILLS\n${formatList(refills, ["date", "medicine", "quantity", "pharmacy"])}`);
  }

  sections.push(`\nUSER QUESTION\n${question}`);

  return sections.join("\n\n");
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
      notesResp.meta.command,
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

    // Try Ollama or Groq for AI-generated answer
    let answer = "";
    let aiModel = "";
    let aiProvider = "";
    let aiError = "";

    async function tryOllama(prompt: string): Promise<string | null> {
      const modelsResp = await coral.executeQuery(
        "SELECT name FROM ollama.models WHERE name NOT LIKE '%embed%' LIMIT 5",
      );
      commands.push(modelsResp.meta.command);
      if (!modelsResp.result || !modelsResp.result.rows.length) return null;

      const model = modelsResp.result.rows[0][0];
      const escapedPrompt = escapeSql(prompt);
      const escapedSystem = escapeSql(SAFETY_SYSTEM_PROMPT);

      const resp = await coral.executeQuery(
        `SELECT response FROM ollama.generate WHERE model = '${model}' AND prompt = '${escapedPrompt}' AND system = '${escapedSystem}' AND num_predict = 1500 AND keep_alive = '0'`,
      );
      commands.push(resp.meta.command);

      if (resp.result && resp.result.rows.length > 0) {
        const text = String(resp.result.rows[0][0] || "");
        if (text) {
          aiModel = model;
          aiProvider = "ollama";
          return text;
        }
      }
      return null;
    }

    async function tryGroq(prompt: string): Promise<string | null> {
      const groqResp = await coral.executeQuery(
        `SELECT content FROM groq_ai.chat_completions WHERE model = 'llama-3.3-70b-versatile' AND prompt = '${escapeSql(prompt)}' AND max_completion_tokens = 1500`,
      );
      commands.push(groqResp.meta.command);
      if (groqResp.result && groqResp.result.rows.length > 0) {
        const text = String(groqResp.result.rows[0][0] || "");
        if (text) {
          aiModel = "llama-3.3-70b-versatile";
          aiProvider = "groq";
          return text;
        }
      }
      return null;
    }

    const promptText = buildPrompt(
      patient,
      currentMedicines,
      recentLabs,
      symptomTimeline,
      doctorInstructions,
      appointments,
      familyNotes,
      refillEvidence,
      q || "Give me a summary of this patient's current status and notable findings.",
    );

    try {
      const ollamaResult = await tryOllama(promptText);
      if (ollamaResult) {
        answer = ollamaResult;
      } else {
        const groqResult = await tryGroq(promptText);
        if (groqResult) {
          answer = groqResult;
        } else {
          aiError = "Ollama and Groq unavailable or returned no response";
        }
      }
    } catch (err: any) {
      aiError = err.message;
    }

    const questionsForDoctor = answer
      ? []
      : [
          "Are the recent HbA1c and fasting glucose reports enough for this follow-up, or should any additional tests be brought?",
          "Symptoms were logged after the medicine change. Ask the doctor whether the timing may be relevant.",
          "Do the refill receipts and current medicine list match what the clinic expects the patient to be taking?",
          "Should BP and weight logs be recorded before the next follow-up?",
          "Are there any records the family should keep in one place before the next appointment?",
        ];

    const summary = answer
      ? answer
      : patient
        ? `${patient.name} is preparing for ${q || "a visit"}. CareOps joined medicines, labs, doctor chats, prescription OCR, receipts, symptoms, appointments, and family notes via coral sql to prepare a doctor-ready packet.`
        : "";

    const questionsForDoctorFinal = answer ? [] : questionsForDoctor;

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
      questionsForDoctor: questionsForDoctorFinal,
      summary,
      aiAnswer: answer || null,
      aiModel: aiModel || null,
      aiProvider: aiProvider || null,
      aiError: aiError || null,
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
        aiAnswer: null,
        aiModel: null,
        aiProvider: null,
        aiError: null,
      },
      { status: 500 },
    );
  }
}
