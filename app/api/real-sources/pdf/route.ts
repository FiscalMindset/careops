import { NextRequest, NextResponse } from "next/server";
import { appendJsonl, overwriteCsv, getSourceManifest, reseedDatabase } from "@/lib/data/data-importer";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ success: false, error: "No file provided" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const fileName = file.name.toLowerCase();

    let rawText: string;
    if (fileName.endsWith(".txt")) {
      rawText = buffer.toString("utf-8");
    } else if (fileName.endsWith(".pdf")) {
      rawText = extractTextFromPdf(buffer);
    } else {
      rawText = buffer.toString("utf-8").replace(/[^a-zA-Z0-9\s\n:.,/-]/g, " ");
    }

    if (!rawText || rawText.length < 5) {
      return NextResponse.json({
        success: false,
        error: "Could not extract text from this file. Try uploading a .txt file or a clear scanned document.",
        textPreview: "",
      }, { status: 400 });
    }

    const extracted = extractFromText(rawText);
    const { prescriptions, labReports } = extracted;
    const warnings: string[] = [];
    let ocrImported = 0;
    let labImported = 0;

    const ocrManifest = getSourceManifest("prescriptionOcr");
    const labManifest = getSourceManifest("labReports");

    if (ocrManifest && prescriptions.length > 0) {
      await appendJsonl(prescriptions, ocrManifest.jsonlFile);
      await overwriteCsv(ocrManifest);
      ocrImported = prescriptions.length;
    }

    if (labManifest && labReports.length > 0) {
      await appendJsonl(labReports, labManifest.jsonlFile);
      await overwriteCsv(labManifest);
      labImported = labReports.length;
    }

    if (ocrImported > 0 || labImported > 0) {
      const seedResult = await reseedDatabase();
      if (!seedResult.success) warnings.push(`DB reseed failed: ${seedResult.error}`);
    }

    if (ocrImported === 0 && labImported === 0) {
      warnings.push("No structured data could be extracted from this document.");
    }

    return NextResponse.json({
      success: true,
      prescriptionsImported: ocrImported,
      labReportsImported: labImported,
      textPreview: (rawText || "").slice(0, 500),
      warnings,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

function extractTextFromPdf(buffer: Buffer): string {
  const raw = buffer.toString("binary");
  const textChunks: string[] = [];
  const textPattern = /\((.*?)\)/g;
  let match;
  while ((match = textPattern.exec(raw)) !== null) {
    const content = match[1]
      .replace(/\\n/g, "\n")
      .replace(/\\r/g, "\r")
      .replace(/\\t/g, "\t")
      .replace(/\\([0-7]{1,3})/g, (_, oct) => String.fromCharCode(parseInt(oct, 8)))
      .replace(/\\(.)/g, "$1");
    const cleaned = content.replace(/[^a-zA-Z0-9\s\n:.,/-]/g, " ").trim();
    if (cleaned.length > 3) {
      textChunks.push(cleaned);
    }
  }
  return textChunks.join("\n");
}

const PATIENT_PATTERN = /patient[:\s]*(pat[-_]?\d{3})/i;
const DATE_PATTERN = /(?:date|dated|dt)[:\s]*(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})/i;
const DOCTOR_PATTERN = /(?:dr|doctor)[.\s]*:?\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/;
const MEDICINE_PATTERN = /(?:Rx|prescribe|medicine|medication|tab|capsule|syrup|injection)[:\s]*([A-Za-z]+(?:[-/\s][A-Za-z]+)*)/gi;
const LAB_TEST_PATTERN = /((?:Hb|WBC|RBC|Platelet|Cholesterol|Glucose|HbA1c|TSH|T3|T4|Creatinine|BUN|SGPT|SGOT|ALP|Bilirubin|Uric|Triglyceride|HDL|LDL|Vitamin)[A-Za-z0-9\s]*?)[:\s]*([<\->~]?\s*\d+\.?\d*\s*)([a-zA-Z/%]+)?/gi;

function extractFromText(text: string) {
  const pid = text.match(PATIENT_PATTERN)?.[1]?.toLowerCase() || "pat-001";
  const dateRaw = text.match(DATE_PATTERN)?.[1] || "";
  const dateStr = dateRaw ? normalizeDate(dateRaw) : new Date().toISOString().split("T")[0];
  const doctorName = text.match(DOCTOR_PATTERN)?.[1] || "Unknown Doctor";

  const prescriptions: Record<string, string>[] = [];
  const medicines: string[] = [];
  const medMatches = text.matchAll(MEDICINE_PATTERN);
  for (const m of medMatches) {
    const name = m[1].trim();
    if (name.length > 1 && !medicines.includes(name)) medicines.push(name);
  }

  if (medicines.length > 0 || /rx|prescription/i.test(text)) {
    prescriptions.push({
      patient_id: pid,
      image_file: "pdf_upload",
      ocr_text: text.slice(0, 1000),
      extracted_medicines: medicines.join(", "),
      doctor_name: doctorName,
      prescription_date: dateStr,
    });
  }

  const labReports: Record<string, string>[] = [];
  const labMatches = text.matchAll(LAB_TEST_PATTERN);
  for (const m of labMatches) {
    const testName = m[1].trim();
    const value = m[2].trim();
    const unit = m[3]?.trim() || "";
    if (value && !isNaN(parseFloat(value))) {
      labReports.push({
        patient_id: pid,
        report_date: dateStr,
        test_name: testName,
        value,
        unit,
        reference_range: "",
        lab_name: "Extracted from document",
        file_path: "pdf_upload",
      });
    }
  }

  return { prescriptions, labReports };
}

function normalizeDate(dateStr: string): string {
  const parts = dateStr.split(/[-/]/);
  if (parts.length === 3) {
    let [a, b, c] = parts;
    if (c.length === 2) c = "20" + c;
    return `${c}-${a.padStart(2, "0")}-${b.padStart(2, "0")}`;
  }
  return dateStr;
}
