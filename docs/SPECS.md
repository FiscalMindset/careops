# CareOps Custom Source Specs

This document defines the custom Coral SQL source specs designed for the CareOps Agent.

## Overview
All specs listed here are currently simulated via a local SQLite database (`careops.db`) for local testing. In a real deployment, these specs would be configured directly in Coral to point to disparate healthcare systems (e.g., Synthea CSV/FHIR, EMR APIs, OCR microservices).

---

## 1. careops_patients_spec
Maps patient demographic and summary records.

**Schema:**
- `patient_id` (TEXT)
- `name` (TEXT)
- `age` (INTEGER)
- `gender` (TEXT)
- `condition_focus` (TEXT)
- `primary_doctor` (TEXT)

**Example Query:**
```sql
SELECT * FROM careops_patients_spec WHERE patient_id = 'pat-001';
```

---

## 2. careops_medications_spec
Maps current and historical medication records.

**Schema:**
- `patient_id` (TEXT)
- `medicine_name` (TEXT)
- `dose` (TEXT)
- `frequency` (TEXT)
- `start_date` (TEXT)
- `end_date` (TEXT)
- `source` (TEXT)
- `notes` (TEXT)

---

## 3. careops_lab_reports_spec
Maps lab and test observations.

**Schema:**
- `patient_id` (TEXT)
- `report_date` (TEXT)
- `test_name` (TEXT)
- `value` (TEXT)
- `unit` (TEXT)
- `reference_range` (TEXT)
- `lab_name` (TEXT)
- `file_path` (TEXT)

---

## 4. careops_doctor_chats_spec
Maps doctor instructions parsed from secure messaging or visit summaries.

**Schema:**
- `patient_id` (TEXT)
- `date` (TEXT)
- `doctor` (TEXT)
- `message` (TEXT)
- `instruction_type` (TEXT)
- `medicine_mentioned` (TEXT)
- `followup_date` (TEXT)

---

## 5. careops_pharmacy_receipts_spec
Maps refill and purchase evidence.

**Schema:**
- `patient_id` (TEXT)
- `date` (TEXT)
- `medicine` (TEXT)
- `quantity` (TEXT)
- `amount` (TEXT)
- `pharmacy` (TEXT)
- `receipt_file` (TEXT)

---

## 6. careops_symptom_logs_spec
Maps symptom history and severity logs.

**Schema:**
- `patient_id` (TEXT)
- `date` (TEXT)
- `symptom` (TEXT)
- `severity` (INTEGER)
- `notes` (TEXT)
- `related_medicine` (TEXT)

---

## 7. careops_appointments_spec
Maps upcoming and past appointments.

**Schema:**
- `patient_id` (TEXT)
- `appointment_date` (TEXT)
- `doctor` (TEXT)
- `speciality` (TEXT)
- `reason` (TEXT)
- `status` (TEXT)

---

## 8. careops_prescription_ocr_spec
Maps OCR-extracted prescription data.

**Schema:**
- `patient_id` (TEXT)
- `image_file` (TEXT)
- `ocr_text` (TEXT)
- `extracted_medicines` (TEXT)
- `doctor_name` (TEXT)
- `prescription_date` (TEXT)

---

## 9. careops_family_notes_spec
Maps family caregiver notes.

**Schema:**
- `patient_id` (TEXT)
- `date` (TEXT)
- `note_author` (TEXT)
- `note_text` (TEXT)
- `priority` (TEXT)

## Future Additions
To add new real sources (like WhatsApp export parsing, email attachments, Google Drive):
1. Create a new data pipeline to dump the parsed output.
2. Define a new `careops_YOUR_NEW_SOURCE_spec` in Coral.
3. Update `DOCTOR_VISIT_PACKET_QUERY` in `src/lib/coral/queries.ts` to `LEFT JOIN` the new spec on `patient_id`.
