const Q = (source: string, table: string) => `${source}.${table}`;

export function getPatientProfileQuery(patientId: string): string {
  const p = Q("careops_patients", "patients");
  return `SELECT patient_id, name, age, gender, condition_focus, primary_doctor FROM ${p} WHERE patient_id = ${escapeId(patientId)} LIMIT 1`;
}

export function getCurrentMedicinesQuery(patientId: string): string {
  const m = Q("careops_medications", "medications");
  return `SELECT medicine_name, dose, frequency, start_date, end_date, source, notes FROM ${m} WHERE patient_id = ${escapeId(patientId)} AND (end_date IS NULL OR end_date = '')`;
}

export function getRecentLabsQuery(patientId: string): string {
  const l = Q("careops_lab_reports", "lab_reports");
  return `SELECT report_date, test_name, value, unit, reference_range, lab_name FROM ${l} WHERE patient_id = ${escapeId(patientId)} ORDER BY report_date DESC`;
}

export function getDoctorInstructionsQuery(patientId: string): string {
  const d = Q("careops_doctor_chats", "doctor_chats");
  return `SELECT date, doctor, message, instruction_type, medicine_mentioned, followup_date FROM ${d} WHERE patient_id = ${escapeId(patientId)} ORDER BY date DESC`;
}

export function getSymptomTimelineQuery(patientId: string): string {
  const s = Q("careops_symptom_logs", "symptom_logs");
  return `SELECT date, symptom, severity, notes, related_medicine FROM ${s} WHERE patient_id = ${escapeId(patientId)} ORDER BY date DESC`;
}

export function getPharmacyRefillsQuery(patientId: string): string {
  const p = Q("careops_pharmacy_receipts", "pharmacy_receipts");
  return `SELECT date, medicine, quantity, amount, pharmacy FROM ${p} WHERE patient_id = ${escapeId(patientId)} ORDER BY date DESC`;
}

export function getAppointmentQuery(patientId: string): string {
  const a = Q("careops_appointments", "appointments");
  return `SELECT appointment_date, doctor, speciality, reason, status FROM ${a} WHERE patient_id = ${escapeId(patientId)} ORDER BY appointment_date DESC`;
}

export function getPrescriptionOcrQuery(patientId: string): string {
  const o = Q("careops_prescription_ocr", "prescription_ocr");
  return `SELECT image_file, ocr_text, extracted_medicines, doctor_name, prescription_date FROM ${o} WHERE patient_id = ${escapeId(patientId)} ORDER BY prescription_date DESC`;
}

export function getFamilyNotesQuery(patientId: string): string {
  const n = Q("careops_family_notes", "family_notes");
  return `SELECT date, note_author, note_text, priority FROM ${n} WHERE patient_id = ${escapeId(patientId)} ORDER BY date DESC`;
}

export function getCarePacketJoinQuery(patientId: string): string {
  const m = Q("careops_medications", "medications");
  const s = Q("careops_symptom_logs", "symptom_logs");
  const l = Q("careops_lab_reports", "lab_reports");
  const d = Q("careops_doctor_chats", "doctor_chats");
  const p = Q("careops_pharmacy_receipts", "pharmacy_receipts");
  const a = Q("careops_appointments", "appointments");
  const n = Q("careops_family_notes", "family_notes");

  const pid = escapeId(patientId);

  return `
SELECT
  m.patient_id,
  m.medicine_name,
  m.dose,
  m.frequency,
  m.start_date,
  s.symptom,
  s.severity,
  s.date AS symptom_date,
  l.test_name,
  l.value,
  l.unit,
  l.report_date,
  d.message AS doctor_instruction,
  d.instruction_type,
  d.medicine_mentioned,
  p.quantity AS refill_quantity,
  p.date AS refill_date,
  p.pharmacy,
  a.appointment_date,
  a.doctor AS appointment_doctor,
  a.speciality,
  a.reason AS appointment_reason,
  a.status AS appointment_status,
  n.note_text AS family_note,
  n.note_author,
  n.priority AS note_priority
FROM ${m} m
LEFT JOIN ${s} s ON s.patient_id = m.patient_id AND s.date >= m.start_date
LEFT JOIN ${l} l ON l.patient_id = m.patient_id
LEFT JOIN ${d} d ON d.patient_id = m.patient_id AND (d.medicine_mentioned = m.medicine_name OR d.message LIKE '%' || m.medicine_name || '%')
LEFT JOIN ${p} p ON p.patient_id = m.patient_id AND p.medicine LIKE '%' || m.medicine_name || '%'
LEFT JOIN ${a} a ON a.patient_id = m.patient_id
LEFT JOIN ${n} n ON n.patient_id = m.patient_id
WHERE m.patient_id = ${pid}
ORDER BY m.start_date DESC, l.report_date DESC, s.date DESC;
`.trim();
}

export function escapeId(id: string): string {
  if (!/^[a-zA-Z0-9_-]+$/.test(id)) {
    throw new Error(`Invalid patient ID: ${id}`);
  }
  return `'${id}'`;
}

const CORAL_SOURCES = [
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

export function translateForSqlite(sql: string): string {
  let result = sql;
  for (const src of CORAL_SOURCES) {
    const pattern = `${src}\\.(\\w+)`;
    result = result.replace(new RegExp(pattern, "g"), `"${src}.$1"`);
  }
  return result;
}
