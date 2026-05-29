export type Patient = {
  patient_id: string;
  name: string;
  age: number;
  gender: string;
  condition_focus: string;
  primary_doctor: string;
};

export type Medication = {
  patient_id: string;
  medicine_name: string;
  dose: string;
  frequency: string;
  start_date: string;
  end_date: string;
  source: string;
  notes: string;
};

export type LabReport = {
  patient_id: string;
  report_date: string;
  test_name: string;
  value: string;
  unit: string;
  reference_range: string;
  lab_name: string;
  file_path: string;
};

export type DoctorChat = {
  patient_id: string;
  date: string;
  doctor: string;
  message: string;
  instruction_type: string;
  medicine_mentioned: string;
  followup_date: string;
};

export type PharmacyReceipt = {
  patient_id: string;
  date: string;
  medicine: string;
  quantity: string;
  amount: string;
  pharmacy: string;
  receipt_file: string;
};

export type SymptomLog = {
  patient_id: string;
  date: string;
  symptom: string;
  severity: number;
  notes: string;
  related_medicine: string;
};

export type Appointment = {
  patient_id: string;
  appointment_date: string;
  doctor: string;
  speciality: string;
  reason: string;
  status: string;
};

export type PrescriptionOcr = {
  patient_id: string;
  image_file: string;
  ocr_text: string;
  extracted_medicines: string;
  doctor_name: string;
  prescription_date: string;
};

export type FamilyNote = {
  patient_id: string;
  date: string;
  note_author: string;
  note_text: string;
  priority: string;
};

export type CareOpsDataset = {
  patients: Patient[];
  medications: Medication[];
  labReports: LabReport[];
  doctorChats: DoctorChat[];
  pharmacyReceipts: PharmacyReceipt[];
  symptomLogs: SymptomLog[];
  appointments: Appointment[];
  prescriptionOcr: PrescriptionOcr[];
  familyNotes: FamilyNote[];
};

export type TimelineEvent = {
  id: string;
  date: string;
  type: "medication" | "lab" | "doctor_chat" | "pharmacy" | "symptom" | "appointment" | "prescription_ocr" | "family_note";
  title: string;
  detail: string;
  source: string;
  confidence: "high" | "medium" | "needs_review";
};

export type JoinedEvidenceRow = {
  patient_id: string;
  medicine_name: string;
  dose: string;
  frequency: string;
  start_date: string;
  symptom?: string;
  severity?: number;
  symptom_date?: string;
  test_name?: string;
  value?: string;
  unit?: string;
  report_date?: string;
  doctor_instruction?: string;
  refill_quantity?: string;
  refill_date?: string;
  source_labels: string[];
  confidence: "high" | "medium" | "needs_review";
};

export type DoctorVisitPacket = {
  patient: Patient;
  visitPurpose: string;
  generatedAt: string;
  summary: string;
  currentMedicines: Medication[];
  medicineChanges: DoctorChat[];
  recentLabs: LabReport[];
  symptomTimeline: SymptomLog[];
  doctorInstructions: DoctorChat[];
  refillEvidence: PharmacyReceipt[];
  upcomingAppointment?: Appointment;
  missingRecords: string[];
  questions: string[];
  timeline: TimelineEvent[];
  evidenceRows: JoinedEvidenceRow[];
  sql: string;
  sourcesUsed: string[];
  safetyDisclaimer: string;
};
