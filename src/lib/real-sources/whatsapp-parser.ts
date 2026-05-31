import type { ParsedWhatsAppMessage } from "./types";

const DOCTOR_KEYWORDS = [
  "dr.", "dr ", "doctor", "daktar", "physician", "cardiologist",
  "neurologist", "orthopedic", "pediatrician", " dermatologist",
  "ophthalmologist", "endocrinologist", "gastroenterologist",
  "pulmonologist", "nephrologist", "oncologist", " rheumatologist",
  "prof.", "professor",
];

const PATIENT_IDS = ["pat-001", "pat-002", "pat-003", "pat-004", "pat-005"];
let patientIndex = 0;
function nextPatientId(): string {
  const id = PATIENT_IDS[patientIndex % PATIENT_IDS.length];
  patientIndex++;
  return id;
}

export function isDoctorSender(sender: string): boolean {
  const lower = sender.toLowerCase();
  return DOCTOR_KEYWORDS.some((kw) => lower.includes(kw));
}

export function parseWhatsAppExport(
  content: string
): { doctorChats: ParsedWhatsAppMessage[]; familyNotes: ParsedWhatsAppMessage[] } {
  const lines = content.split("\n").filter(Boolean);
  const doctorChats: ParsedWhatsAppMessage[] = [];
  const familyNotes: ParsedWhatsAppMessage[] = [];

  const messagePattern =
    /^(\d{1,2}\/\d{1,2}\/\d{2,4},\s*\d{1,2}:\d{2}(?::\d{2})?\s*(?:AM|PM)?)\s*-\s*([^:]+):\s*(.+)/;

  for (const line of lines) {
    const match = line.match(messagePattern);
    if (!match) continue;

    const [, dateStr, senderRaw, text] = match;
    const sender = senderRaw.trim();

    if (text.length < 2) continue;

    const msg: ParsedWhatsAppMessage = {
      patient_id: nextPatientId(),
      date: normalizeDate(dateStr),
      sender,
      text: text.trim(),
      is_from_doctor: isDoctorSender(sender),
    };

    if (msg.is_from_doctor) {
      doctorChats.push(msg);
    } else {
      familyNotes.push(msg);
    }
  }

  return { doctorChats, familyNotes };
}

export function formatAsDoctorChatRecord(
  msg: ParsedWhatsAppMessage
): Record<string, string> {
  const textLower = msg.text.toLowerCase();
  const medicineMentioned = extractMedicineName(textLower) || "";
  const instructionType = classifyInstruction(textLower);

  return {
    patient_id: msg.patient_id,
    date: msg.date,
    doctor: msg.sender,
    message: msg.text,
    instruction_type: instructionType,
    medicine_mentioned: medicineMentioned,
    followup_date: "",
  };
}

export function formatAsFamilyNoteRecord(
  msg: ParsedWhatsAppMessage
): Record<string, string> {
  return {
    patient_id: msg.patient_id,
    date: msg.date,
    note_author: msg.sender,
    note_text: msg.text,
    priority: detectPriority(msg.text),
  };
}

const COMMON_MEDICINES = [
  "amlodipine", "metformin", "atorvastatin", "lisinopril", "losartan",
  "omeprazole", "aspirin", "metoprolol", "levothyroxine", "simvastatin",
  "hydrochlorothiazide", "gabapentin", "insulin", "glipizide", "warfarin",
  "clopidogrel", "prednisone", "ibuprofen", "paracetamol", "acetaminophen",
];

function extractMedicineName(text: string): string | null {
  for (const med of COMMON_MEDICINES) {
    if (text.includes(med)) return med;
  }
  return null;
}

function classifyInstruction(text: string): string {
  if (text.includes("dose") || text.includes("dosage") || text.includes("take")) return "dosage_change";
  if (text.includes("test") || text.includes("lab") || text.includes("report")) return "test_result";
  if (text.includes("follow") || text.includes("next visit") || text.includes("appointment")) return "followup";
  if (text.includes("prescribe") || text.includes("prescription") || text.includes("new medicine")) return "new_prescription";
  if (text.includes("stop") || text.includes("discontinue") || text.includes("avoid")) return "caution";
  return "general";
}

function detectPriority(text: string): string {
  const lower = text.toLowerCase();
  if (lower.includes("urgent") || lower.includes("emergency") || lower.includes("immediately")) return "high";
  if (lower.includes("please check") || lower.includes("important") || lower.includes("reminder")) return "medium";
  return "normal";
}

function normalizeDate(dateStr: string): string {
  const d = new Date(dateStr);
  if (!isNaN(d.getTime())) {
    return d.toISOString().split("T")[0];
  }
  const parts = dateStr.match(/(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
  if (parts) {
    let [, m, day, year] = parts;
    if (year.length === 2) year = "20" + year;
    return `${year}-${m.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }
  return dateStr;
}
