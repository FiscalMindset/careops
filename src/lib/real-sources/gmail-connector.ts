import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { appendJsonl, overwriteCsv, getSourceManifest, reseedDatabase } from "@/lib/data/data-importer";
import type { ImportResult } from "./types";

const execFileAsync = promisify(execFile);

const CORAL_BIN = process.env.CORAL_CLI_PATH || "coral";

const DOCTOR_DOMAIN_PATTERN = /(dr|doctor|clinic|hospital|medical|health|care|diagnostic|lab|pharmacy)\./i;
const DOCTOR_SUBJECT_PATTERN = /(prescription|lab result|report|appointment|follow.up|diagnosis|medicine|refill|health update)/i;

export interface GmailDoctorEmail {
  id: string;
  thread_id: string;
  snippet: string;
  from_name?: string;
  from_email?: string;
  subject?: string;
  date?: string;
}

export async function fetchDoctorEmails(): Promise<{
  emails: GmailDoctorEmail[];
  errors: string[];
}> {
  const errors: string[] = [];

  try {
    const query = `
      SELECT id, thread_id, snippet
      FROM gmail.messages
      WHERE q = 'from:(dr OR doctor OR clinic OR hospital) after:2025/01/01'
      LIMIT 50
    `.trim();

    const { stdout } = await execFileAsync(CORAL_BIN, [
      "sql", "--format", "json", query,
    ]);

    const parsed = JSON.parse(stdout);
    const emails: GmailDoctorEmail[] = [];

    if (Array.isArray(parsed)) {
      for (const row of parsed) {
        emails.push({
          id: row.id || "",
          thread_id: row.thread_id || "",
          snippet: row.snippet || "",
          from_name: row.from_name,
          from_email: row.from_email,
          subject: row.subject,
          date: row.date,
        });
      }
    }

    return { emails, errors };
  } catch (err: any) {
    const msg = err.message || String(err);
    if (msg.includes("source 'gmail' not found") || msg.includes("unknown source")) {
      errors.push("Gmail source not registered. Run: coral source add --file coral/sources/community/gmail/manifest.yaml");
    } else {
      errors.push(`Gmail query failed: ${msg}`);
    }
    return { emails: [], errors };
  }
}

export async function importDoctorEmailsFromGmail(): Promise<ImportResult> {
  const { emails, errors: fetchErrors } = await fetchDoctorEmails();
  if (fetchErrors.length > 0) {
    return {
      success: false,
      sourceLabel: "Gmail",
      recordsImported: 0,
      targetTable: "doctor_chats",
      errors: fetchErrors,
      warnings: [],
    };
  }

  if (emails.length === 0) {
    return {
      success: true,
      sourceLabel: "Gmail",
      recordsImported: 0,
      targetTable: "doctor_chats",
      errors: [],
      warnings: ["No doctor-related emails found."],
    };
  }

  const warnings: string[] = [];
  const manifest = getSourceManifest("doctorChats");
  if (!manifest) {
    return {
      success: false,
      sourceLabel: "Gmail",
      recordsImported: 0,
      targetTable: "doctor_chats",
      errors: ["doctor_chats source manifest not found"],
      warnings: [],
    };
  }

  const now = new Date().toISOString().split("T")[0];
  let imported = 0;

  for (const email of emails) {
    try {
      const record: Record<string, string> = {
        patient_id: "pat-001",
        date: email.date || now,
        doctor: email.from_name || email.from_email || "Unknown",
        message: `[Gmail] ${email.subject ? email.subject + ": " : ""}${email.snippet}`,
        instruction_type: classifyGmailSubject(email.subject || ""),
        medicine_mentioned: extractMedicineFromSnippet(email.snippet),
        followup_date: "",
      };

      await appendJsonl([record], manifest.jsonlFile);
      imported++;
    } catch (err: any) {
      warnings.push(`Failed to import email ${email.id}: ${err.message}`);
    }
  }

  try {
    await overwriteCsv(manifest);
    await reseedDatabase();
  } catch (err: any) {
    warnings.push(`DB reseed failed: ${err.message}`);
  }

  return {
    success: imported > 0,
    sourceLabel: "Gmail",
    recordsImported: imported,
    targetTable: "doctor_chats",
    errors: [],
    warnings,
  };
}

function classifyGmailSubject(subject: string): string {
  const lower = subject.toLowerCase();
  if (lower.includes("prescription") || lower.includes("refill")) return "new_prescription";
  if (lower.includes("report") || lower.includes("result") || lower.includes("lab")) return "test_result";
  if (lower.includes("appointment") || lower.includes("follow")) return "followup";
  if (lower.includes("dose") || lower.includes("medicine")) return "dosage_change";
  return "general";
}

function extractMedicineFromSnippet(snippet: string): string {
  const COMMON = ["amlodipine", "metformin", "atorvastatin", "lisinopril", "losartan",
    "omeprazole", "aspirin", "metoprolol", "levothyroxine", "simvastatin",
    "insulin", "gabapentin", "prednisone", "ibuprofen", "paracetamol"];
  const lower = snippet.toLowerCase();
  for (const med of COMMON) {
    if (lower.includes(med)) return med;
  }
  return "";
}
