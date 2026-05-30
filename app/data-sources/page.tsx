import type { Metadata } from "next";
import { loadCareOpsData } from "@/lib/data/load-careops-data";
import fs from "fs";
import { join } from "path";
import DataSourcesClient from "./data-sources-client";

export const metadata: Metadata = {
  title: "Data Sources — CareOps Agent",
};

async function readManifest(dir: string): Promise<string | null> {
  try {
    const p = join(process.cwd(), "coral", "sources", "careops", dir, "manifest.yaml");
    return fs.readFileSync(p, "utf-8");
  } catch { return null; }
}

export default async function DataSourcesPage() {
  const data = await loadCareOpsData();

  const sourceEntries = [
    { key: "patients", label: "Patients", specName: "careops_patients", dir: "patients", table: "patients", rows: data.patients },
    { key: "medications", label: "Medications", specName: "careops_medications", dir: "medications", table: "medications", rows: data.medications },
    { key: "labReports", label: "Lab Reports", specName: "careops_lab_reports", dir: "lab_reports", table: "lab_reports", rows: data.labReports },
    { key: "doctorChats", label: "Doctor Chats", specName: "careops_doctor_chats", dir: "doctor_chats", table: "doctor_chats", rows: data.doctorChats },
    { key: "pharmacyReceipts", label: "Pharmacy Receipts", specName: "careops_pharmacy_receipts", dir: "pharmacy_receipts", table: "pharmacy_receipts", rows: data.pharmacyReceipts },
    { key: "symptomLogs", label: "Symptom Logs", specName: "careops_symptom_logs", dir: "symptom_logs", table: "symptom_logs", rows: data.symptomLogs },
    { key: "appointments", label: "Appointments", specName: "careops_appointments", dir: "appointments", table: "appointments", rows: data.appointments },
    { key: "prescriptionOcr", label: "Prescription OCR", specName: "careops_prescription_ocr", dir: "prescription_ocr", table: "prescription_ocr", rows: data.prescriptionOcr },
    { key: "familyNotes", label: "Family Notes", specName: "careops_family_notes", dir: "family_notes", table: "family_notes", rows: data.familyNotes },
  ];

  const manifests = await Promise.all(sourceEntries.map(e => readManifest(e.dir)));

  const entries = sourceEntries.map((e, idx) => ({
    key: e.key,
    label: e.label,
    specName: e.specName,
    dir: e.dir,
    table: e.table,
    manifestYaml: manifests[idx],
    sampleRows: e.rows.slice(0, 2),
    rowCount: e.rows.length,
  }));

  return <DataSourcesClient entries={entries} />;
}
