import { NextRequest, NextResponse } from "next/server";
import { getCarePacketJoinQuery } from "@/lib/coral/careops-queries";
import { CoralClient } from "@/lib/coral/client";

export async function GET(request: NextRequest) {
  const patientId = request.nextUrl.searchParams.get("patientId") || "";
  const purpose = request.nextUrl.searchParams.get("purpose") || "diabetes follow-up";

  if (!patientId) {
    return NextResponse.json({ error: "patientId is required" }, { status: 400 });
  }

  if (!/^[a-zA-Z0-9_-]+$/.test(patientId)) {
    return NextResponse.json({ error: "Invalid patientId format" }, { status: 400 });
  }

  const coral = new CoralClient();
  const sql = getCarePacketJoinQuery(patientId);
  const resp = await coral.executeQuery(sql);
  const mode = coral.executionMode;

  const joinedRows = resp.result
    ? resp.result.rows.map((rowArray: any[]) => {
        const obj: Record<string, any> = {};
        resp.result!.columns.forEach((col: string, i: number) => (obj[col] = rowArray[i]));
        return obj;
      })
    : [];

  return NextResponse.json({
    mode,
    patientId,
    visitPurpose: purpose,
    commands: [resp.meta.command],
    sourcesUsed: [
      "careops_patients",
      "careops_medications",
      "careops_lab_reports",
      "careops_doctor_chats",
      "careops_pharmacy_receipts",
      "careops_symptom_logs",
      "careops_appointments",
      "careops_prescription_ocr",
      "careops_family_notes",
    ],
    sql,
    rawCoralOutput: resp.meta.rawOutput,
    executionTimeMs: resp.meta.durationMs,
    joinedRows,
    rowCount: joinedRows.length,
    error: resp.error,
    timestamp: new Date().toISOString(),
  });
}
