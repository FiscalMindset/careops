import type { ExtractedPrescription, ExtractedLabReport } from "./types";

export interface PdfExtractResult {
  prescriptions: ExtractedPrescription[];
  labReports: ExtractedLabReport[];
  rawText: string;
  errors: string[];
}

const PATIENT_PATTERN = /patient[:\s]*(pat[-_]?\d{3})/i;
const DATE_PATTERN = /(?:date|dated|dt)[:\s]*(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})/i;
const DOCTOR_PATTERN = /(?:dr|doctor|physician)[.\s]*:?\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/g;
const MEDICINE_PATTERN = /(?:Rx|prescribe|medicine|medication|tab|capsule|syrup|injection)[:\s]*([A-Za-z]+(?:[-/\s][A-Za-z]+)*)/gi;
const LAB_TEST_PATTERN = /((?:Hb|WBC|RBC|Platelet|Cholesterol|Glucose|HbA1c|TSH|T3|T4|Creatinine|BUN|SGPT|SGOT|ALP|Bilirubin|Uric|Triglyceride|HDL|LDL|Vitamin)[A-Za-z0-9\s]*)[:\s]*([<\->~]?\s*\d+\.?\d*\s*)([a-zA-Z/%]+)?/gi;

const NORMAL_RANGES: Record<string, string> = {
  hb: "13-17 g/dL",
  wbc: "4000-11000 /µL",
  rbc: "4.5-5.5 million/µL",
  platelet: "150000-450000 /µL",
  cholesterol: "<200 mg/dL",
  glucose: "70-110 mg/dL",
  hba1c: "<5.7%",
  tsh: "0.4-4.0 mIU/L",
  creatinine: "0.6-1.2 mg/dL",
  bun: "7-20 mg/dL",
  sgpt: "7-56 U/L",
  sgot: "10-40 U/L",
};

const LAB_NAMES = ["pathology", "diagnostic", "lab", "clinic", "hospital", "medical center"];

export function extractPdfText(buffer: Buffer): PdfExtractResult {
  const errors: string[] = [];
  let rawText: string;

  try {
    rawText = buffer.toString("utf-8").replace(/[^\x20-\x7E\n]/g, " ");
  } catch {
    errors.push("Could not decode PDF text content");
    rawText = buffer.toString("utf-8").replace(/[^a-zA-Z0-9\s\n:.,/-]/g, " ");
  }

  if (rawText.length < 10) {
    errors.push("Extracted text is empty or too short");
  }

  const prescriptions = extractPrescriptions(rawText);
  const labReports = extractLabReports(rawText);

  return { prescriptions, labReports, rawText, errors };
}

function extractPrescriptions(text: string): ExtractedPrescription[] {
  const results: ExtractedPrescription[] = [];

  const patientMatch = text.match(PATIENT_PATTERN);
  const patientId = patientMatch?.[1]?.toLowerCase() || "pat-001";

  const dateMatch = text.match(DATE_PATTERN);
  const dateStr = dateMatch ? normalizePdfDate(dateMatch[1]) : new Date().toISOString().split("T")[0];

  const doctorMatch = text.match(DOCTOR_PATTERN);
  const doctorName = doctorMatch ? doctorMatch.map((d) => d.replace(/^(dr|doctor|physician)[.\s]*:?\s*/i, ""))[0] || "Unknown Doctor" : "Unknown Doctor";

  const medicines: string[] = [];
  const medMatches = text.matchAll(MEDICINE_PATTERN);
  for (const m of medMatches) {
    const name = m[1].trim();
    if (name.length > 1 && name.length < 50 && !medicines.includes(name)) {
      medicines.push(name);
    }
  }

  if (medicines.length > 0 || text.toLowerCase().includes("rx")) {
    results.push({
      patient_id: patientId,
      doctor_name: doctorName,
      prescription_date: dateStr,
      medicines,
      raw_text: text.slice(0, 500),
    });
  }

  return results;
}

function extractLabReports(text: string): ExtractedLabReport[] {
  const results: ExtractedLabReport[] = [];

  const patientMatch = text.match(PATIENT_PATTERN);
  const patientId = patientMatch?.[1]?.toLowerCase() || "pat-001";

  const dateMatch = text.match(DATE_PATTERN);
  const dateStr = dateMatch ? normalizePdfDate(dateMatch[1]) : new Date().toISOString().split("T")[0];

  let labName = "Unknown Lab";
  const labMatch = text.match(new RegExp(LAB_NAMES.join("|"), "i"));
  if (labMatch) {
    const line = text.split("\n").find((l) => l.toLowerCase().includes(labMatch[0]));
    if (line) labName = line.trim();
  }

  const matches = text.matchAll(LAB_TEST_PATTERN);
  for (const m of matches) {
    const testName = m[1].trim();
    const value = m[2].trim();
    const unit = m[3]?.trim() || "";
    const key = testName.toLowerCase().split(/\s+/)[0];
    const refRange = NORMAL_RANGES[key] || "";

    if (value && !isNaN(parseFloat(value))) {
      results.push({
        patient_id: patientId,
        report_date: dateStr,
        test_name: testName,
        value,
        unit,
        reference_range: refRange,
        lab_name: labName,
        raw_text: text.slice(0, 200),
      });
    }
  }

  return results;
}

function normalizePdfDate(dateStr: string): string {
  const parts = dateStr.split(/[-/]/);
  if (parts.length === 3) {
    let [a, b, c] = parts;
    if (c.length === 2) c = "20" + c;
    return `${c}-${a.padStart(2, "0")}-${b.padStart(2, "0")}`;
  }
  return new Date(dateStr).toISOString().split("T")[0];
}
