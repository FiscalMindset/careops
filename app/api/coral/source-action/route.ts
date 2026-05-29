import { NextRequest, NextResponse } from "next/server";
import { runCoralSql, runCoralSourceLint, runCoralSourceAdd, runCoralSourceTest, runCoralSourceList } from "@/lib/coral/coral-cli-client";
import { parseCoralSourceList } from "@/lib/coral/coral-output-parser";
import { join } from "path";

const SOURCES_DIR = join(process.cwd(), "coral", "sources", "careops");

const SOURCE_CONFIG: Record<string, { dir: string; table: string }> = {
  careops_patients: { dir: "patients", table: "patients" },
  careops_medications: { dir: "medications", table: "medications" },
  careops_lab_reports: { dir: "lab_reports", table: "lab_reports" },
  careops_doctor_chats: { dir: "doctor_chats", table: "doctor_chats" },
  careops_pharmacy_receipts: { dir: "pharmacy_receipts", table: "pharmacy_receipts" },
  careops_symptom_logs: { dir: "symptom_logs", table: "symptom_logs" },
  careops_appointments: { dir: "appointments", table: "appointments" },
  careops_prescription_ocr: { dir: "prescription_ocr", table: "prescription_ocr" },
  careops_family_notes: { dir: "family_notes", table: "family_notes" },
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, sourceName } = body;

    if (!action || !sourceName) {
      return NextResponse.json({ error: "action and sourceName are required" }, { status: 400 });
    }

    const config = SOURCE_CONFIG[sourceName];
    if (!config) {
      return NextResponse.json({ error: `Unknown source: ${sourceName}` }, { status: 400 });
    }

    const manifestPath = join(SOURCES_DIR, config.dir, "manifest.yaml");
    let result;

    switch (action) {
      case "lint": {
        const resp = await runCoralSourceLint(manifestPath);
        result = { command: resp.command, stdout: resp.stdout, stderr: resp.stderr, success: !resp.stderr };
        break;
      }
      case "add": {
        const resp = await runCoralSourceAdd(manifestPath);
        result = { command: resp.command, stdout: resp.stdout, stderr: resp.stderr, success: !resp.stderr };
        break;
      }
      case "test": {
        const resp = await runCoralSourceTest(sourceName);
        result = { command: resp.command, stdout: resp.stdout, stderr: resp.stderr, success: !resp.stderr };
        break;
      }
      case "query": {
        const sql = `SELECT * FROM ${sourceName}.${config.table} LIMIT 5`;
        const resp = await runCoralSql(sql, "json");
        let rows: Record<string, any>[] = [];
        try {
          const parsed = JSON.parse(resp.stdout.trim());
          if (Array.isArray(parsed)) rows = parsed;
        } catch { /* passthrough */ }
        result = { command: resp.command, stdout: resp.stdout, stderr: resp.stderr, success: true, rows };
        break;
      }
      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }

    return NextResponse.json({
      mode: "coral_cli",
      action,
      sourceName,
      ...result,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: `Coral CLI execution failed: ${error.message}` },
      { status: 500 }
    );
  }
}
