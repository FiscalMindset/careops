import { NextResponse } from "next/server";
import { CoralClient } from "@/lib/coral/client";
import { escapeId } from "@/lib/coral/careops-queries";

const SOURCES = [
  { name: "careops_medications", table: "medications", cols: "medicine_name, dose, frequency, start_date, end_date" },
  { name: "careops_lab_reports", table: "lab_reports", cols: "report_date, test_name, value, unit, reference_range" },
  { name: "careops_symptom_logs", table: "symptom_logs", cols: "date, symptom, severity, notes, related_medicine" },
  { name: "careops_doctor_chats", table: "doctor_chats", cols: "date, doctor, message, instruction_type" },
  { name: "careops_appointments", table: "appointments", cols: "appointment_date, doctor, speciality, reason, status" },
  { name: "careops_pharmacy_receipts", table: "pharmacy_receipts", cols: "date, medicine, quantity, amount, pharmacy" },
  { name: "careops_family_notes", table: "family_notes", cols: "date, note_author, note_text, priority" },
];

async function query(sql: string, coral: CoralClient) {
  const resp = await coral.executeQuery(sql);
  if (resp.error || !resp.result) return [];
  const cols = resp.result.columns;
  return resp.result.rows.map((row: any[]) => {
    const obj: Record<string, any> = {};
    cols.forEach((c, i) => (obj[c] = row[i]));
    return obj;
  });
}

async function queryWithRetry(sql: string, coral: CoralClient, retries = 2): Promise<any[]> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    const result = await query(sql, coral);
    if (result.length > 0 || attempt === retries) return result;
  }
  return [];
}

export async function GET() {
  const t0 = performance.now();
  const coral = new CoralClient();

  const patients = await queryWithRetry(
    "SELECT patient_id, name, age, gender, condition_focus, primary_doctor FROM careops_patients.patients LIMIT 10",
    coral,
  );

  const patientList: any[] = patients.map((r: any) => ({
    patient_id: r.patient_id,
    name: r.name,
    age: Number(r.age),
    gender: r.gender,
    condition_focus: r.condition_focus,
    primary_doctor: r.primary_doctor,
  }));

  const BATCH_SIZE = 10;

  async function runAll(pid: string) {
    const ep = escapeId(pid);
    const queries = SOURCES.map(
      (s) => `SELECT ${s.cols} FROM ${s.name}.${s.table} WHERE patient_id = ${ep} ORDER BY 1 DESC`,
    );
    const results = await Promise.all(queries.map((q) => queryWithRetry(q, coral)));
    return {
      pid,
      medicines: results[0],
      labs: results[1],
      symptoms: results[2],
      chats: results[3],
      appointments: results[4],
      receipts: results[5],
      notes: results[6],
    };
  }

  const batches: any[] = [];
  for (let i = 0; i < patientList.length; i += BATCH_SIZE) {
    const batch = patientList.slice(i, i + BATCH_SIZE);
    const batchResults = await Promise.all(batch.map((p: any) => runAll(p.patient_id)));
    batches.push(...batchResults);
  }

  const dataByPid = Object.fromEntries(batches.map((b: any) => [b.pid, b]));

  const enriched = patientList.map((pt: any) => {
    const d = dataByPid[pt.patient_id] || { medicines: [], labs: [], symptoms: [], chats: [], appointments: [], receipts: [], notes: [] };
    const avgSeverity = d.symptoms.length
      ? Math.round((d.symptoms.reduce((s: number, x: any) => s + x.severity, 0) / d.symptoms.length) * 10) / 10
      : 0;
    return {
      id: pt.patient_id,
      name: pt.name,
      age: pt.age,
      condition: pt.condition_focus,
      doctor: pt.primary_doctor,
      medicineCount: d.medicines.length,
      labCount: d.labs.length,
      symptomCount: d.symptoms.length,
      chatCount: d.chats.length,
      appointmentCount: d.appointments.length,
      receiptCount: d.receipts.length,
      noteCount: d.notes.length,
      avgSeverity,
      activeMedicines: d.medicines.filter((m: any) => !m.end_date || m.end_date === "").length,
      medicines: d.medicines,
      labs: d.labs,
      symptoms: d.symptoms,
      chats: d.chats,
      appointments: d.appointments,
      receipts: d.receipts,
      notes: d.notes,
    };
  });

  const durationMs = Math.round(performance.now() - t0);

  return NextResponse.json({ patients: enriched, durationMs });
}
