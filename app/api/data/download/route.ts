import { NextRequest, NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";

const CSV_MAP: Record<string, string> = {
  patients: "patients.csv",
  medications: "medications.csv",
  labReports: "lab_reports.csv",
  doctorChats: "doctor_chats.csv",
  pharmacyReceipts: "pharmacy_receipts.csv",
  symptomLogs: "symptom_logs.csv",
  appointments: "appointments.csv",
  prescriptionOcr: "prescription_ocr.csv",
  familyNotes: "family_notes.csv",
};

export async function GET(request: NextRequest) {
  const sourceKey = request.nextUrl.searchParams.get("sourceKey");

  if (!sourceKey || !CSV_MAP[sourceKey]) {
    return NextResponse.json({ error: "Invalid or missing sourceKey" }, { status: 400 });
  }

  const filePath = path.join(process.cwd(), "data", CSV_MAP[sourceKey]);

  try {
    const content = fs.readFileSync(filePath, "utf-8");
    return new NextResponse(content, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="${CSV_MAP[sourceKey]}"`,
      },
    });
  } catch {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }
}
