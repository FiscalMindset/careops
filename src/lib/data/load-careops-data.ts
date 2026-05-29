import { z } from "zod";
import type { CareOpsDataset } from "@/types/careops";
import { loadCsv } from "./csv";

const patientSchema = z.object({
  patient_id: z.string(),
  name: z.string(),
  age: z.coerce.number(),
  gender: z.string(),
  condition_focus: z.string(),
  primary_doctor: z.string()
});

const symptomSchema = z.object({
  patient_id: z.string(),
  date: z.string(),
  symptom: z.string(),
  severity: z.coerce.number(),
  notes: z.string(),
  related_medicine: z.string()
});

const passthrough = z.object({ patient_id: z.string() }).passthrough();

export async function loadCareOpsData(): Promise<CareOpsDataset> {
  const [
    patients,
    medications,
    labReports,
    doctorChats,
    pharmacyReceipts,
    symptomLogs,
    appointments,
    prescriptionOcr,
    familyNotes
  ] = await Promise.all([
    loadCsv("patients.csv"),
    loadCsv("medications.csv"),
    loadCsv("lab_reports.csv"),
    loadCsv("doctor_chats.csv"),
    loadCsv("pharmacy_receipts.csv"),
    loadCsv("symptom_logs.csv"),
    loadCsv("appointments.csv"),
    loadCsv("prescription_ocr.csv"),
    loadCsv("family_notes.csv")
  ]);

  return {
    patients: z.array(patientSchema).parse(patients),
    medications: z.array(passthrough).parse(medications) as CareOpsDataset["medications"],
    labReports: z.array(passthrough).parse(labReports) as CareOpsDataset["labReports"],
    doctorChats: z.array(passthrough).parse(doctorChats) as CareOpsDataset["doctorChats"],
    pharmacyReceipts: z.array(passthrough).parse(pharmacyReceipts) as CareOpsDataset["pharmacyReceipts"],
    symptomLogs: z.array(symptomSchema).parse(symptomLogs),
    appointments: z.array(passthrough).parse(appointments) as CareOpsDataset["appointments"],
    prescriptionOcr: z.array(passthrough).parse(prescriptionOcr) as CareOpsDataset["prescriptionOcr"],
    familyNotes: z.array(passthrough).parse(familyNotes) as CareOpsDataset["familyNotes"]
  };
}

export async function getPatientDataset(patientId: string) {
  const data = await loadCareOpsData();
  return {
    patient: data.patients.find((patient) => patient.patient_id === patientId),
    medications: data.medications.filter((row) => row.patient_id === patientId),
    labReports: data.labReports.filter((row) => row.patient_id === patientId),
    doctorChats: data.doctorChats.filter((row) => row.patient_id === patientId),
    pharmacyReceipts: data.pharmacyReceipts.filter((row) => row.patient_id === patientId),
    symptomLogs: data.symptomLogs.filter((row) => row.patient_id === patientId),
    appointments: data.appointments.filter((row) => row.patient_id === patientId),
    prescriptionOcr: data.prescriptionOcr.filter((row) => row.patient_id === patientId),
    familyNotes: data.familyNotes.filter((row) => row.patient_id === patientId)
  };
}
