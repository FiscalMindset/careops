import fs from "node:fs/promises";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { parse as parseCsv } from "csv-parse/sync";

const execFileAsync = promisify(execFile);

const TSX_BIN = process.env.TSX_PATH || "npx";
const DATA_DIR = path.resolve(process.cwd(), "data");
const SEED_SCRIPT = path.resolve(process.cwd(), "scripts/seed.ts");

export interface SourceManifest {
  key: string;
  label: string;
  specName: string;
  table: string;
  jsonlFile: string;
  csvFile: string;
  dbTable: string;
  columns: { name: string; type: string; nullable?: boolean }[];
}

const SOURCE_MANIFESTS: SourceManifest[] = [
  {
    key: "patients", label: "Patients", specName: "careops_patients", table: "patients",
    jsonlFile: "patients.jsonl", csvFile: "patients.csv", dbTable: "careops_patients_spec",
    columns: [
      { name: "patient_id", type: "Utf8" }, { name: "name", type: "Utf8" },
      { name: "age", type: "Int64" }, { name: "gender", type: "Utf8" },
      { name: "condition_focus", type: "Utf8" }, { name: "primary_doctor", type: "Utf8" },
    ],
  },
  {
    key: "medications", label: "Medications", specName: "careops_medications", table: "medications",
    jsonlFile: "medications.jsonl", csvFile: "medications.csv", dbTable: "careops_medications_spec",
    columns: [
      { name: "patient_id", type: "Utf8" }, { name: "medicine_name", type: "Utf8" },
      { name: "dose", type: "Utf8" }, { name: "frequency", type: "Utf8" },
      { name: "start_date", type: "Utf8" }, { name: "end_date", type: "Utf8", nullable: true },
      { name: "source", type: "Utf8" }, { name: "notes", type: "Utf8" },
    ],
  },
  {
    key: "labReports", label: "Lab Reports", specName: "careops_lab_reports", table: "lab_reports",
    jsonlFile: "lab_reports.jsonl", csvFile: "lab_reports.csv", dbTable: "careops_lab_reports_spec",
    columns: [
      { name: "patient_id", type: "Utf8" }, { name: "report_date", type: "Utf8" },
      { name: "test_name", type: "Utf8" }, { name: "value", type: "Utf8" },
      { name: "unit", type: "Utf8" }, { name: "reference_range", type: "Utf8" },
      { name: "lab_name", type: "Utf8" }, { name: "file_path", type: "Utf8" },
    ],
  },
  {
    key: "doctorChats", label: "Doctor Chats", specName: "careops_doctor_chats", table: "doctor_chats",
    jsonlFile: "doctor_chats.jsonl", csvFile: "doctor_chats.csv", dbTable: "careops_doctor_chats_spec",
    columns: [
      { name: "patient_id", type: "Utf8" }, { name: "date", type: "Utf8" },
      { name: "doctor", type: "Utf8" }, { name: "message", type: "Utf8" },
      { name: "instruction_type", type: "Utf8" }, { name: "medicine_mentioned", type: "Utf8", nullable: true },
      { name: "followup_date", type: "Utf8", nullable: true },
    ],
  },
  {
    key: "pharmacyReceipts", label: "Pharmacy Receipts", specName: "careops_pharmacy_receipts", table: "pharmacy_receipts",
    jsonlFile: "pharmacy_receipts.jsonl", csvFile: "pharmacy_receipts.csv", dbTable: "careops_pharmacy_receipts_spec",
    columns: [
      { name: "patient_id", type: "Utf8" }, { name: "date", type: "Utf8" },
      { name: "medicine", type: "Utf8" }, { name: "quantity", type: "Utf8" },
      { name: "amount", type: "Utf8" }, { name: "pharmacy", type: "Utf8" },
      { name: "receipt_file", type: "Utf8" },
    ],
  },
  {
    key: "symptomLogs", label: "Symptom Logs", specName: "careops_symptom_logs", table: "symptom_logs",
    jsonlFile: "symptom_logs.jsonl", csvFile: "symptom_logs.csv", dbTable: "careops_symptom_logs_spec",
    columns: [
      { name: "patient_id", type: "Utf8" }, { name: "date", type: "Utf8" },
      { name: "symptom", type: "Utf8" }, { name: "severity", type: "Int64" },
      { name: "notes", type: "Utf8" }, { name: "related_medicine", type: "Utf8" },
    ],
  },
  {
    key: "appointments", label: "Appointments", specName: "careops_appointments", table: "appointments",
    jsonlFile: "appointments.jsonl", csvFile: "appointments.csv", dbTable: "careops_appointments_spec",
    columns: [
      { name: "patient_id", type: "Utf8" }, { name: "appointment_date", type: "Utf8" },
      { name: "doctor", type: "Utf8" }, { name: "speciality", type: "Utf8" },
      { name: "reason", type: "Utf8" }, { name: "status", type: "Utf8" },
    ],
  },
  {
    key: "prescriptionOcr", label: "Prescription OCR", specName: "careops_prescription_ocr", table: "prescription_ocr",
    jsonlFile: "prescription_ocr.jsonl", csvFile: "prescription_ocr.csv", dbTable: "careops_prescription_ocr_spec",
    columns: [
      { name: "patient_id", type: "Utf8" }, { name: "image_file", type: "Utf8" },
      { name: "ocr_text", type: "Utf8" }, { name: "extracted_medicines", type: "Utf8" },
      { name: "doctor_name", type: "Utf8" }, { name: "prescription_date", type: "Utf8" },
    ],
  },
  {
    key: "familyNotes", label: "Family Notes", specName: "careops_family_notes", table: "family_notes",
    jsonlFile: "family_notes.jsonl", csvFile: "family_notes.csv", dbTable: "careops_family_notes_spec",
    columns: [
      { name: "patient_id", type: "Utf8" }, { name: "date", type: "Utf8" },
      { name: "note_author", type: "Utf8" }, { name: "note_text", type: "Utf8" },
      { name: "priority", type: "Utf8" },
    ],
  },
];

export function getSourceManifest(sourceKey: string): SourceManifest | undefined {
  return SOURCE_MANIFESTS.find((s) => s.key === sourceKey);
}

export function getAllSourceManifests(): SourceManifest[] {
  return SOURCE_MANIFESTS;
}

export interface ImportResult {
  success: boolean;
  sourceKey: string;
  recordsImported: number;
  totalRecords: number;
  validationErrors: string[];
  dbSeeded: boolean;
  error?: string;
}

export async function parseUploadedFile(
  content: string,
  fileName: string
): Promise<Record<string, string>[]> {
  const ext = path.extname(fileName).toLowerCase();
  if (ext === ".csv") {
    return parseCsv(content, { columns: true, skip_empty_lines: true, trim: true }) as Record<string, string>[];
  }
  if (ext === ".json" || ext === ".jsonl") {
    const lines = content.trim().split("\n").filter(Boolean);
    return lines.map((line) => JSON.parse(line));
  }
  throw new Error(`Unsupported file format: ${ext}. Use .csv, .json, or .jsonl`);
}

export function validateColumns(
  rows: Record<string, string>[],
  manifest: SourceManifest
): string[] {
  if (rows.length === 0) return [];
  const errors: string[] = [];
  const actualCols = new Set(Object.keys(rows[0]));
  const expectedCols = manifest.columns.map((c) => c.name);
  const requiredCols = manifest.columns.filter((c) => !c.nullable).map((c) => c.name);

  const missing = requiredCols.filter((col) => !actualCols.has(col));
  if (missing.length > 0) {
    errors.push(`Missing required columns: ${missing.join(", ")}`);
  }

  const unknown = [...actualCols].filter((col) => !expectedCols.includes(col));
  if (unknown.length > 0) {
    errors.push(`Unknown columns (will be ignored): ${unknown.join(", ")}`);
  }

  if (manifest.key === "symptomLogs" || manifest.key === "patients") {
    for (let i = 0; i < rows.length; i++) {
      if (manifest.key === "patients") {
        const age = parseInt(rows[i]["age"], 10);
        if (isNaN(age)) errors.push(`Row ${i + 1}: "age" must be a number`);
      }
      if (manifest.key === "symptomLogs") {
        const sev = parseInt(rows[i]["severity"], 10);
        if (isNaN(sev) || sev < 1 || sev > 5) errors.push(`Row ${i + 1}: "severity" must be a number 1-5`);
      }
    }
  }

  return errors;
}

export async function appendJsonl(
  rows: Record<string, string>[],
  jsonlFile: string
): Promise<void> {
  const filePath = path.join(DATA_DIR, jsonlFile);
  const lines = rows.map((row) => JSON.stringify(row));
  await fs.appendFile(filePath, lines.join("\n") + "\n", "utf-8");
}

export async function overwriteCsv(
  manifest: SourceManifest
): Promise<void> {
  const jsonlPath = path.join(DATA_DIR, manifest.jsonlFile);
  const csvPath = path.join(DATA_DIR, manifest.csvFile);
  const content = await fs.readFile(jsonlPath, "utf-8").catch(() => "");
  const lines = content.trim().split("\n").filter(Boolean);
  if (lines.length === 0) {
    await fs.writeFile(csvPath, manifest.columns.map((c) => c.name).join(",") + "\n", "utf-8");
    return;
  }
  const allRows = lines.map((l) => JSON.parse(l));
  const cols = manifest.columns.map((c) => c.name);
  const header = cols.join(",");
  const csvLines = allRows.map((row) =>
    cols.map((col) => {
      const val = row[col] ?? "";
      const str = String(val);
      return str.includes(",") || str.includes('"') || str.includes("\n")
        ? `"${str.replace(/"/g, '""')}"`
        : str;
    }).join(",")
  );
  await fs.writeFile(csvPath, header + "\n" + csvLines.join("\n") + "\n", "utf-8");
}

export async function reseedDatabase(): Promise<{ success: boolean; error?: string }> {
  try {
    await execFileAsync(TSX_BIN, ["tsx", SEED_SCRIPT], {
      timeout: 30000,
      cwd: process.cwd(),
    });
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function getSourceRecordCounts(): Promise<Record<string, number>> {
  const counts: Record<string, number> = {};
  for (const manifest of SOURCE_MANIFESTS) {
    const filePath = path.join(DATA_DIR, manifest.jsonlFile);
    try {
      const content = await fs.readFile(filePath, "utf-8");
      const lines = content.trim().split("\n").filter(Boolean);
      counts[manifest.key] = lines.length;
    } catch {
      counts[manifest.key] = 0;
    }
  }
  return counts;
}

export async function importData(
  sourceKey: string,
  content: string,
  fileName: string
): Promise<ImportResult> {
  const manifest = getSourceManifest(sourceKey);
  if (!manifest) {
    return { success: false, sourceKey, recordsImported: 0, totalRecords: 0, validationErrors: [], dbSeeded: false, error: `Unknown source: ${sourceKey}` };
  }

  try {
    const rows = await parseUploadedFile(content, fileName);
    if (rows.length === 0) {
      return { success: false, sourceKey, recordsImported: 0, totalRecords: 0, validationErrors: [], dbSeeded: false, error: "File is empty" };
    }

    const validationErrors = validateColumns(rows, manifest);
    if (validationErrors.some((e) => e.startsWith("Missing required"))) {
      return { success: false, sourceKey, recordsImported: 0, totalRecords: rows.length, validationErrors, dbSeeded: false };
    }

    await appendJsonl(rows, manifest.jsonlFile);
    await overwriteCsv(manifest);

    const seedResult = await reseedDatabase();

    const counts = await getSourceRecordCounts();

    return {
      success: true,
      sourceKey,
      recordsImported: rows.length,
      totalRecords: counts[sourceKey] || rows.length,
      validationErrors,
      dbSeeded: seedResult.success,
      error: seedResult.success ? undefined : seedResult.error,
    };
  } catch (err: any) {
    return { success: false, sourceKey, recordsImported: 0, totalRecords: 0, validationErrors: [], dbSeeded: false, error: err.message };
  }
}
