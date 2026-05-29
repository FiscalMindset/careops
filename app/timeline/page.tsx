import { CoralClient } from "@/lib/coral/client";
import {
  getCurrentMedicinesQuery,
  getRecentLabsQuery,
  getDoctorInstructionsQuery,
  getSymptomTimelineQuery,
  getPharmacyRefillsQuery,
  getAppointmentQuery,
  getFamilyNotesQuery,
} from "@/lib/coral/careops-queries";
import { PageHeader, TimelineEventCard } from "@/components/ui";
import type { TimelineEvent } from "@/types/careops";

const PATIENT_ID = "pat-001";

function extractRows(resp: { result: { columns: string[]; rows: any[][] } | null }): Record<string, any>[] {
  if (!resp.result) return [];
  return resp.result.rows.map((row) => {
    const obj: Record<string, any> = {};
    resp.result!.columns.forEach((col, i) => (obj[col] = row[i]));
    return obj;
  });
}

export default async function TimelinePage() {
  const coral = new CoralClient();

  const [medResp, labResp, instrResp, symResp, refResp, aptResp, noteResp] = await Promise.all([
    coral.executeQuery(getCurrentMedicinesQuery(PATIENT_ID)),
    coral.executeQuery(getRecentLabsQuery(PATIENT_ID)),
    coral.executeQuery(getDoctorInstructionsQuery(PATIENT_ID)),
    coral.executeQuery(getSymptomTimelineQuery(PATIENT_ID)),
    coral.executeQuery(getPharmacyRefillsQuery(PATIENT_ID)),
    coral.executeQuery(getAppointmentQuery(PATIENT_ID)),
    coral.executeQuery(getFamilyNotesQuery(PATIENT_ID)),
  ]);

  const medicines = extractRows(medResp);
  const labs = extractRows(labResp);
  const instructions = extractRows(instrResp);
  const symptoms = extractRows(symResp);
  const refills = extractRows(refResp);
  const appointments = extractRows(aptResp);
  const notes = extractRows(noteResp);

  const events: TimelineEvent[] = [
    ...medicines.map((m, i) => ({
      id: `med-${i}`, date: m.start_date, type: "medication" as const,
      title: `${m.medicine_name} ${m.dose}`,
      detail: `${m.frequency}${m.notes ? " \u2014 " + m.notes : ""}`,
      source: "careops_medications", confidence: "high" as const,
    })),
    ...labs.map((l, i) => ({
      id: `lab-${i}`, date: l.report_date, type: "lab" as const,
      title: l.test_name,
      detail: `${l.value} ${l.unit} (ref: ${l.reference_range}) \u2014 ${l.lab_name}`,
      source: "careops_lab_reports", confidence: "high" as const,
    })),
    ...instructions.map((d, i) => ({
      id: `chat-${i}`, date: d.date, type: "doctor_chat" as const,
      title: `Instruction: ${d.instruction_type}`,
      detail: d.message,
      source: "careops_doctor_chats", confidence: "high" as const,
    })),
    ...symptoms.map((s, i) => ({
      id: `sym-${i}`, date: s.date, type: "symptom" as const,
      title: s.symptom,
      detail: `Severity: ${s.severity}${s.notes ? " \u2014 " + s.notes : ""}`,
      source: "careops_symptom_logs", confidence: "high" as const,
    })),
    ...refills.map((r, i) => ({
      id: `ref-${i}`, date: r.date, type: "pharmacy" as const,
      title: `Refill: ${r.medicine}`,
      detail: `${r.quantity} @ ${r.pharmacy}`,
      source: "careops_pharmacy_receipts", confidence: "high" as const,
    })),
    ...appointments.map((a, i) => ({
      id: `apt-${i}`, date: a.appointment_date, type: "appointment" as const,
      title: `${a.speciality} with ${a.doctor}`,
      detail: `${a.reason} (${a.status})`,
      source: "careops_appointments", confidence: "high" as const,
    })),
    ...notes.map((n, i) => ({
      id: `note-${i}`, date: n.date, type: "family_note" as const,
      title: `Note from ${n.note_author}`,
      detail: n.note_text,
      source: "careops_family_notes",
      confidence: (n.priority === "high" ? "high" : "medium") as "high" | "medium",
    })),
  ];

  events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const errors = [medResp.error, labResp.error, instrResp.error, symResp.error, refResp.error, aptResp.error, noteResp.error].filter(Boolean);

  return (
    <div>
      <PageHeader title="Care Timeline" eyebrow="Cross-source chronology">
        A Coral-style joined timeline across prescriptions, chats, symptoms, labs, refills, appointments, and family notes.
      </PageHeader>
      <div className="mb-4 flex items-center gap-2">
        <span className="text-xs text-muted">Query mode:</span>
        <span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-info">
          {coral.executionMode === "coral_cli" ? "Real Coral CLI" : coral.executionMode}
        </span>
        <span className="text-xs text-muted">{events.length} events</span>
      </div>
      {errors.length > 0 && (
        <div className="mb-4 rounded border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
          <strong>Note:</strong> {errors.length} source(s) returned warnings. Some events may be incomplete.
        </div>
      )}
      <div className="max-w-4xl">
        {events.length > 0 ? (
          events.map((event) => <TimelineEventCard key={event.id} event={event} />)
        ) : (
          <p className="text-muted">No timeline events found.</p>
        )}
      </div>
    </div>
  );
}
