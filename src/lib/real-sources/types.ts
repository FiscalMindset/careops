export interface RealSourceConfig {
  enabled: boolean;
  label: string;
  description: string;
  icon: string;
  importMode: "coral_sql" | "file_upload" | "api_poll";
}

export interface ImportResult {
  success: boolean;
  sourceLabel: string;
  recordsImported: number;
  targetTable: string;
  errors: string[];
  warnings: string[];
}

export interface ParsedWhatsAppMessage {
  patient_id: string;
  date: string;
  sender: string;
  text: string;
  is_from_doctor: boolean;
}

export interface ExtractedPrescription {
  patient_id: string;
  doctor_name: string;
  prescription_date: string;
  medicines: string[];
  raw_text: string;
}

export interface ExtractedLabReport {
  patient_id: string;
  report_date: string;
  test_name: string;
  value: string;
  unit: string;
  reference_range: string;
  lab_name: string;
  raw_text: string;
}

export interface CalendarEvent {
  patient_id: string;
  appointment_date: string;
  doctor: string;
  speciality: string;
  reason: string;
  status: string;
}
