import { NextRequest, NextResponse } from "next/server";
import { loadCareOpsData } from "@/lib/data/load-careops-data";
import { CoralClient } from "@/lib/coral/client";
import { DOCTOR_VISIT_PACKET_QUERY } from "@/lib/coral/queries";
import { generateDoctorVisitPacket } from "@/lib/agent/careops-agent";

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
      familyNotes: data.familyNotes.length
    },
    total: data.patients.length + data.medications.length + data.labReports.length + data.doctorChats.length + data.pharmacyReceipts.length + data.symptomLogs.length + data.appointments.length + data.prescriptionOcr.length + data.familyNotes.length
  };
}

const SPECS = [
  { name: "careops_patients_spec", source: "data/patients.jsonl", columns: ["patient_id", "name", "age", "gender", "condition_focus", "primary_doctor"] },
  { name: "careops_medications_spec", source: "data/medications.jsonl", columns: ["patient_id", "medicine_name", "dose", "frequency", "start_date", "end_date", "source", "notes"] },
  { name: "careops_lab_reports_spec", source: "data/lab_reports.jsonl", columns: ["patient_id", "report_date", "test_name", "value", "unit", "reference_range", "lab_name", "file_path"] },
  { name: "careops_doctor_chats_spec", source: "data/doctor_chats.jsonl", columns: ["patient_id", "date", "doctor", "message", "instruction_type", "medicine_mentioned", "followup_date"] },
  { name: "careops_pharmacy_receipts_spec", source: "data/pharmacy_receipts.jsonl", columns: ["patient_id", "date", "medicine", "quantity", "amount", "pharmacy", "receipt_file"] },
  { name: "careops_symptom_logs_spec", source: "data/symptom_logs.jsonl", columns: ["patient_id", "date", "symptom", "severity", "notes", "related_medicine"] },
  { name: "careops_appointments_spec", source: "data/appointments.jsonl", columns: ["patient_id", "appointment_date", "doctor", "speciality", "reason", "status"] },
  { name: "careops_prescription_ocr_spec", source: "data/prescription_ocr.jsonl", columns: ["patient_id", "image_file", "ocr_text", "extracted_medicines", "doctor_name", "prescription_date"] },
  { name: "careops_family_notes_spec", source: "data/family_notes.jsonl", columns: ["patient_id", "date", "note_author", "note_text", "priority"] }
];

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q") || "";
  const patientId = request.nextUrl.searchParams.get("patientId") || "pat-001";

  try {
    const t0 = performance.now();

    const sqlQuery = DOCTOR_VISIT_PACKET_QUERY;
    const coral = new CoralClient();
    let rows: any[] = [];
    try {
      const resp = await coral.executeQuery(DOCTOR_VISIT_PACKET_QUERY, [patientId]);
      if (resp.result) {
        const cols = resp.result.columns || [];
        rows = resp.result.rows.map((rowArray: any[]) => {
          const obj: Record<string, any> = {};
          cols.forEach((col: string, i: number) => obj[col] = rowArray[i]);
          return obj;
        });
      }
    } catch {
      rows = [];
    }

    const packet = await generateDoctorVisitPacket(patientId, q || "diabetes follow-up");
    const datasetStats = await getDatasetStats();
    const t1 = performance.now();

    return NextResponse.json({
      query: q || "diabetes follow-up",
      patientId,
      patient: packet.patient,
      sql: sqlQuery,
      specsUsed: SPECS,
      rowCount: rows.length,
      executionTimeMs: Math.round(t1 - t0),
      datasetStats,
      rows: rows.slice(0, 50),
      packet
    });
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : "Query failed",
      query: q,
      sql: DOCTOR_VISIT_PACKET_QUERY,
      specsUsed: SPECS,
      rowCount: 0,
      executionTimeMs: 0,
      datasetStats: { totalRows: {}, total: 0 },
      rows: [],
      packet: null
    }, { status: 500 });
  }
}
