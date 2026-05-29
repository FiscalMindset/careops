import type { JoinedEvidenceRow, TimelineEvent } from "@/types/careops";
import { getPatientDataset } from "@/lib/data/load-careops-data";
import { getCarePacketJoinQuery } from "./careops-queries";

export async function runMockCoralJoin(patientId: string): Promise<JoinedEvidenceRow[]> {
  const data = await getPatientDataset(patientId);
  return data.medications.flatMap((medication) => {
    const symptoms = data.symptomLogs.filter((symptom) => symptom.date >= medication.start_date);
    const labs = data.labReports;
    const chats = data.doctorChats.filter((chat) => {
      const mentioned = chat.medicine_mentioned || "";
      return mentioned === medication.medicine_name || chat.message.toLowerCase().includes(medication.medicine_name.toLowerCase());
    });
    const receipts = data.pharmacyReceipts.filter((receipt) =>
      receipt.medicine.toLowerCase().includes(medication.medicine_name.toLowerCase())
    );

    const symptomRows = symptoms.length ? symptoms : [undefined];
    const labRows = labs.length ? labs : [undefined];
    const chatRows = chats.length ? chats : [undefined];
    const receiptRows = receipts.length ? receipts : [undefined];

    return symptomRows.flatMap((symptom) =>
      labRows.flatMap((lab) =>
        chatRows.flatMap((chat) =>
          receiptRows.map((receipt) => ({
            patient_id: medication.patient_id,
            medicine_name: medication.medicine_name,
            dose: medication.dose,
            frequency: medication.frequency,
            start_date: medication.start_date,
            symptom: symptom?.symptom,
            severity: symptom?.severity,
            symptom_date: symptom?.date,
            test_name: lab?.test_name,
            value: lab?.value,
            unit: lab?.unit,
            report_date: lab?.report_date,
            doctor_instruction: chat?.message,
            refill_quantity: receipt?.quantity,
            refill_date: receipt?.date,
            source_labels: ["careops_medications", "careops_symptom_logs", "careops_lab_reports", "careops_doctor_chats", "careops_pharmacy_receipts"],
            confidence: receipt && lab ? "high" : "medium"
          }))
        )
      )
    );
  });
}

export async function buildMockTimeline(patientId: string): Promise<TimelineEvent[]> {
  const data = await getPatientDataset(patientId);
  const events: TimelineEvent[] = [
    ...data.medications.map((row) => ({
      id: `med-${row.medicine_name}-${row.start_date}`,
      date: row.start_date,
      type: "medication" as const,
      title: `${row.medicine_name} ${row.dose}`,
      detail: `${row.frequency}. ${row.notes}`,
      source: row.source,
      confidence: "high" as const
    })),
    ...data.labReports.map((row) => ({
      id: `lab-${row.test_name}-${row.report_date}`,
      date: row.report_date,
      type: "lab" as const,
      title: `${row.test_name}: ${row.value}${row.unit}`,
      detail: `${row.lab_name}. Reference: ${row.reference_range}.`,
      source: "careops_lab_reports",
      confidence: "high" as const
    })),
    ...data.doctorChats.map((row) => ({
      id: `chat-${row.date}-${row.instruction_type}`,
      date: row.date,
      type: "doctor_chat" as const,
      title: row.instruction_type.replaceAll("_", " "),
      detail: row.message,
      source: "careops_doctor_chats",
      confidence: "high" as const
    })),
    ...data.pharmacyReceipts.map((row) => ({
      id: `pharmacy-${row.medicine}-${row.date}`,
      date: row.date,
      type: "pharmacy" as const,
      title: `${row.medicine} refill evidence`,
      detail: `${row.quantity} from ${row.pharmacy}. Receipt: ${row.receipt_file}`,
      source: "careops_pharmacy_receipts",
      confidence: "medium" as const
    })),
    ...data.symptomLogs.map((row) => ({
      id: `symptom-${row.symptom}-${row.date}`,
      date: row.date,
      type: "symptom" as const,
      title: `${row.symptom} logged`,
      detail: `Severity ${row.severity}/5. ${row.notes}`,
      source: "careops_symptom_logs",
      confidence: "medium" as const
    })),
    ...data.appointments.map((row) => ({
      id: `appointment-${row.appointment_date}`,
      date: row.appointment_date,
      type: "appointment" as const,
      title: `${row.reason} with ${row.doctor}`,
      detail: `${row.speciality}. Status: ${row.status}.`,
      source: "careops_appointments",
      confidence: "high" as const
    })),
    ...data.prescriptionOcr.map((row) => ({
      id: `ocr-${row.prescription_date}`,
      date: row.prescription_date,
      type: "prescription_ocr" as const,
      title: `Prescription OCR from ${row.doctor_name}`,
      detail: row.ocr_text,
      source: "careops_prescription_ocr",
      confidence: "needs_review" as const
    })),
    ...data.familyNotes.map((row) => ({
      id: `note-${row.date}-${row.note_author}`,
      date: row.date,
      type: "family_note" as const,
      title: `Family note from ${row.note_author}`,
      detail: row.note_text,
      source: "careops_family_notes",
      confidence: row.priority === "high" ? "medium" as const : "needs_review" as const
    }))
  ];

  return events.sort((a, b) => b.date.localeCompare(a.date));
}

export const mockCoralMeta = {
  mode: "mock",
  sql: getCarePacketJoinQuery("pat-001"),
  note: "Mock Coral uses local CSV sources shaped like proposed Coral source specs."
};
