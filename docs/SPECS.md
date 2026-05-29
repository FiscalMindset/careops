# CareOps Custom Source Specs

This document defines the 9 custom Coral source specs registered with the real Coral CLI for the CareOps Agent.

## Overview

All 9 specs use **real Coral manifests** with `backend: jsonl`, pointing at JSONL files in the `data/` directory. They are registered with `coral source add --file` and queryable via `coral sql --format json`.

**Registration status**: ✅ All 9 registered, all 18 declared test queries pass.

**Convention**: Each spec `careops_{name}` exposes a table `careops_{name}.{name}` (e.g. `careops_patients.patients`, `careops_medications.medications`).

---

## 1. `careops_patients`

Patient demographic and summary records.

**Table**: `careops_patients.patients`

| Column | Type | Description |
|--------|------|-------------|
| `patient_id` | Utf8 | Unique patient identifier |
| `name` | Utf8 | Patient full name |
| `age` | Int64 | Patient age in years |
| `gender` | Utf8 | Patient gender |
| `condition_focus` | Utf8 | Primary condition for the current care focus |
| `primary_doctor` | Utf8 | Primary care physician name |

**Example query**: `SELECT * FROM careops_patients.patients WHERE patient_id = 'pat-001';`

**Test queries**: 2/2 pass (SELECT + COUNT)

---

## 2. `careops_medications`

Current and historical medication records with dosage schedules.

**Table**: `careops_medications.medications`

| Column | Type | Description |
|--------|------|-------------|
| `patient_id` | Utf8 | Foreign key to careops_patients |
| `medicine_name` | Utf8 | Generic or brand medicine name |
| `dose` | Utf8 | Dosage strength (e.g. 500 mg) |
| `frequency` | Utf8 | Administration schedule |
| `start_date` | Utf8 | Medication start date (ISO format) |
| `end_date` | Utf8 (nullable) | Medication end date if discontinued |
| `source` | Utf8 | Origin of this medication record |
| `notes` | Utf8 | Prescribing or clinical notes |

**Test queries**: 2/2 pass

---

## 3. `careops_lab_reports`

Lab and test observations.

**Table**: `careops_lab_reports.lab_reports`

| Column | Type | Description |
|--------|------|-------------|
| `patient_id` | Utf8 | Foreign key to careops_patients |
| `report_date` | Utf8 | Date of lab test |
| `test_name` | Utf8 | Name of the test (e.g. HbA1c, Fasting Glucose) |
| `value` | Utf8 | Test result value |
| `unit` | Utf8 | Unit of measurement |
| `reference_range` | Utf8 | Normal reference range |
| `lab_name` | Utf8 | Name of the lab |
| `file_path` | Utf8 | Path to original report file |

**Test queries**: 2/2 pass

---

## 4. `careops_doctor_chats`

Doctor instructions parsed from secure messaging or visit summaries.

**Table**: `careops_doctor_chats.doctor_chats`

| Column | Type | Description |
|--------|------|-------------|
| `patient_id` | Utf8 | Foreign key to careops_patients |
| `date` | Utf8 | Date of the message |
| `doctor` | Utf8 | Doctor who sent the instruction |
| `message` | Utf8 | Full message text |
| `instruction_type` | Utf8 | Type of instruction (e.g. dose_change, lab_ordered) |
| `medicine_mentioned` | Utf8 | Medicine referenced in the message |
| `followup_date` | Utf8 | Recommended follow-up date |

**Test queries**: 2/2 pass

---

## 5. `careops_pharmacy_receipts`

Refill and purchase evidence.

**Table**: `careops_pharmacy_receipts.pharmacy_receipts`

| Column | Type | Description |
|--------|------|-------------|
| `patient_id` | Utf8 | Foreign key to careops_patients |
| `date` | Utf8 | Date of purchase |
| `medicine` | Utf8 | Medicine name |
| `quantity` | Utf8 | Quantity dispensed |
| `amount` | Utf8 | Amount paid |
| `pharmacy` | Utf8 | Pharmacy name |
| `receipt_file` | Utf8 | Path to receipt image |

**Test queries**: 2/2 pass

---

## 6. `careops_symptom_logs`

Symptom history and severity logs.

**Table**: `careops_symptom_logs.symptom_logs`

| Column | Type | Description |
|--------|------|-------------|
| `patient_id` | Utf8 | Foreign key to careops_patients |
| `date` | Utf8 | Date symptom was logged |
| `symptom` | Utf8 | Symptom description |
| `severity` | Int64 | Severity rating (1-10) |
| `notes` | Utf8 | Additional notes |
| `related_medicine` | Utf8 | Medicine potentially related to the symptom |

**Test queries**: 2/2 pass

---

## 7. `careops_appointments`

Upcoming and past appointments.

**Table**: `careops_appointments.appointments`

| Column | Type | Description |
|--------|------|-------------|
| `patient_id` | Utf8 | Foreign key to careops_patients |
| `appointment_date` | Utf8 | Date of appointment |
| `doctor` | Utf8 | Doctor name |
| `speciality` | Utf8 | Medical speciality |
| `reason` | Utf8 | Reason for visit |
| `status` | Utf8 | Appointment status (scheduled/completed) |

**Test queries**: 2/2 pass

---

## 8. `careops_prescription_ocr`

OCR-extracted prescription data.

**Table**: `careops_prescription_ocr.prescription_ocr`

| Column | Type | Description |
|--------|------|-------------|
| `patient_id` | Utf8 | Foreign key to careops_patients |
| `image_file` | Utf8 | Path to prescription image |
| `ocr_text` | Utf8 | Raw OCR output |
| `extracted_medicines` | Utf8 | Parsed medicine names from OCR |
| `doctor_name` | Utf8 | Prescribing doctor |
| `prescription_date` | Utf8 | Date of prescription |

**Test queries**: 2/2 pass

---

## 9. `careops_family_notes`

Family caregiver notes.

**Table**: `careops_family_notes.family_notes`

| Column | Type | Description |
|--------|------|-------------|
| `patient_id` | Utf8 | Foreign key to careops_patients |
| `date` | Utf8 | Date of note |
| `note_author` | Utf8 | Family member who wrote the note |
| `note_text` | Utf8 | Note content |
| `priority` | Utf8 | Priority level (high/medium/low) |

**Test queries**: 2/2 pass

---

## Adding a New Source Spec

1. Create a JSONL data file in `data/` (e.g. `data/new_source.jsonl`)
2. Create a Coral manifest in `coral/sources/careops/{name}/manifest.yaml` with:
   - `backend: jsonl`
   - Proper table columns (omit `format` property)
   - 2+ test queries
   - Hardcoded absolute path in `source.location`
3. Register: `coral source add --file coral/sources/careops/{name}/manifest.yaml`
4. Add a query template function in `src/lib/coral/careops-queries.ts`
5. Update `loadCareOpsData` and TypeScript types if the data is loaded client-side
6. Test: `coral source test careops_{name}`
