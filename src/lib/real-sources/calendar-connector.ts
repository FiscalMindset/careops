import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { appendJsonl, overwriteCsv, getSourceManifest, reseedDatabase } from "@/lib/data/data-importer";
import type { ImportResult } from "./types";

const execFileAsync = promisify(execFile);
const CORAL_BIN = process.env.CORAL_CLI_PATH || "coral";

const DOCTOR_CALENDAR_SUBJECTS = /(dr\.|doctor|clinic|hospital|appointment|checkup|follow.up|consultation|visit|medical|health)/i;
const SPECIALITY_MAP: Record<string, string> = {
  cardio: "Cardiology",
  heart: "Cardiology",
  neuro: "Neurology",
  ortho: "Orthopedics",
  ent: "ENT",
  eye: "Ophthalmology",
  skin: "Dermatology",
  gastro: "Gastroenterology",
  diabetic: "Endocrinology",
  thyroid: "Endocrinology",
  child: "Pediatrics",
  pediatric: "Pediatrics",
  bone: "Orthopedics",
  spine: "Orthopedics",
  lung: "Pulmonology",
  kidney: "Nephrology",
  liver: "Hepatology",
};

export interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: string;
  end: string;
  location?: string;
}

export async function fetchCalendarEvents(): Promise<{
  events: CalendarEvent[];
  errors: string[];
}> {
  const errors: string[] = [];

  try {
    const query = `
      SELECT id, summary, description, start, end, location
      FROM google_calendar.events
      WHERE time_min = '${getThirtyDaysAgo()}'
        AND time_max = '${getNinetyDaysAhead()}'
      LIMIT 50
    `.trim();

    const { stdout } = await execFileAsync(CORAL_BIN, [
      "sql", "--format", "json", query,
    ]);

    const parsed = JSON.parse(stdout);
    const events: CalendarEvent[] = [];

    if (Array.isArray(parsed)) {
      for (const row of parsed) {
        events.push({
          id: row.id || "",
          summary: row.summary || "",
          description: row.description || "",
          start: row.start || "",
          end: row.end || "",
          location: row.location || "",
        });
      }
    }

    return { events, errors };
  } catch (err: any) {
    const msg = err.message || String(err);
    if (msg.includes("source 'google_calendar' not found") || msg.includes("unknown source")) {
      errors.push("Google Calendar source not registered. Create a Coral source spec for Google Calendar.");
    } else {
      errors.push(`Calendar query failed: ${msg}`);
    }
    return { events: [], errors };
  }
}

export async function importAppointmentsFromCalendar(): Promise<ImportResult> {
  const { events, errors: fetchErrors } = await fetchCalendarEvents();
  if (fetchErrors.length > 0) {
    return {
      success: false,
      sourceLabel: "Google Calendar",
      recordsImported: 0,
      targetTable: "appointments",
      errors: fetchErrors,
      warnings: [],
    };
  }

  const doctorEvents = events.filter((e) =>
    DOCTOR_CALENDAR_SUBJECTS.test(e.summary) ||
    DOCTOR_CALENDAR_SUBJECTS.test(e.description || "")
  );

  if (doctorEvents.length === 0) {
    return {
      success: true,
      sourceLabel: "Google Calendar",
      recordsImported: 0,
      targetTable: "appointments",
      errors: [],
      warnings: ["No medical appointments found in calendar."],
    };
  }

  const warnings: string[] = [];
  const manifest = getSourceManifest("appointments");
  if (!manifest) {
    return {
      success: false,
      sourceLabel: "Google Calendar",
      recordsImported: 0,
      targetTable: "appointments",
      errors: ["appointments source manifest not found"],
      warnings: [],
    };
  }

  let imported = 0;

  for (const event of doctorEvents) {
    try {
      const speciality = detectSpeciality(event.summary + " " + (event.description || ""));
      const dateStr = event.start.split("T")[0] || new Date().toISOString().split("T")[0];

      const record: Record<string, string> = {
        patient_id: "pat-001",
        appointment_date: dateStr,
        doctor: event.summary.replace(/appointment|with|dr\.?/gi, "").trim() || "Unknown",
        speciality,
        reason: event.description || event.summary,
        status: "scheduled",
      };

      await appendJsonl([record], manifest.jsonlFile);
      imported++;
    } catch (err: any) {
      warnings.push(`Failed to import event ${event.id}: ${err.message}`);
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
    sourceLabel: "Google Calendar",
    recordsImported: imported,
    targetTable: "appointments",
    errors: [],
    warnings,
  };
}

function detectSpeciality(text: string): string {
  const lower = text.toLowerCase();
  for (const [key, speciality] of Object.entries(SPECIALITY_MAP)) {
    if (lower.includes(key)) return speciality;
  }
  if (lower.includes("check") || lower.includes("routine") || lower.includes("general")) return "General Checkup";
  return "General Consultation";
}

function getThirtyDaysAgo(): string {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  return d.toISOString();
}

function getNinetyDaysAhead(): string {
  const d = new Date();
  d.setDate(d.getDate() + 90);
  return d.toISOString();
}
