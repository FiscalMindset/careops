# CareOps Coral Source Specs

This document describes every Coral source spec in the CareOps project. Each spec is a `manifest.yaml` file that tells Coral how to load, query, and validate a data source.

## Spec Anatomy

Every CareOps spec follows this structure:

```yaml
name: careops_<source>      # Unique source name, used in SQL as source.table
version: 0.1.0               # Spec version
dsl_version: 3               # Coral DSL version
backend: jsonl               # Data backend (Coral v0.2.0 supports jsonl, not file)
description: ...             # Human-readable description
inputs:
  DATA_PATH:                 # Template variable for data directory
    kind: variable
    default: /path/to/data
test_queries:                # Queries run during coral source test
  - SELECT ... LIMIT 3
  - SELECT COUNT(*) ...
tables:
  - name: <table_name>       # Table name, used in SQL as source.table
    description: ...
    source:
      location: "file:///path/to/data/"
      glob: "<name>.jsonl"   # Glob pattern matching the data file
    columns:
      - name: <column_name>
        type: Utf8 | Int64   # Column type
        description: ...
```

## Important Coral CLI v0.2.0 Notes

- `backend: file` is **not supported** — use `backend: jsonl` instead
- `format` property in table definitions causes errors with `jsonl` — omit it
- Template variables like `{{input.DATA_PATH}}` are **not resolved** when using `coral source add --file` — hardcode absolute paths
- Queries must use `source.table` syntax without quotes (e.g. `careops_patients.patients`)
- Each spec should have at least 2 test queries for `coral source test` to pass

## Specs

### 1. careops_patients

**Purpose:** Patient demographics and medical focus records. This is the central table that all other sources join against.

**Manifest:** `coral/sources/careops/patients/manifest.yaml`
**Data:** `data/patients.jsonl` (5 rows)

| Column | Type | Description |
|--------|------|-------------|
| `patient_id` | Utf8 | Primary key. Format: `pat-001` |
| `name` | Utf8 | Full name |
| `age` | Int64 | Age in years |
| `gender` | Utf8 | Gender |
| `condition_focus` | Utf8 | Primary condition (e.g. "Type 2 Diabetes") |
| `primary_doctor` | Utf8 | PCP name |

**Sample row:**
```json
{"patient_id":"pat-001","name":"Raman Mehta","age":68,"gender":"Male","condition_focus":"Type 2 Diabetes","primary_doctor":"Dr. Sharma"}
```

**Used in queries:**
```sql
SELECT p.name, p.age, p.condition_focus
FROM careops_patients.patients p
WHERE p.patient_id = 'pat-001'
```

---

### 2. careops_medications

**Purpose:** Current and historical medication records with dosage schedules.

**Manifest:** `coral/sources/careops/medications/manifest.yaml`
**Data:** `data/medications.jsonl` (9 rows)

| Column | Type | Description |
|--------|------|-------------|
| `patient_id` | Utf8 | FK to careops_patients |
| `medicine_name` | Utf8 | Medicine name |
| `dose` | Utf8 | Dosage (e.g. "500 mg") |
| `frequency` | Utf8 | Schedule (e.g. "Once daily") |
| `start_date` | Utf8 | Start date (ISO) |
| `end_date` | Utf8 (nullable) | End date if discontinued |
| `source` | Utf8 | Record origin |
| `notes` | Utf8 | Clinical notes |

**Sample row:**
```json
{"patient_id":"pat-001","medicine_name":"Metformin","dose":"500 mg","frequency":"Twice daily","start_date":"2025-03-15","end_date":null,"source":"Doctor Chat","notes":"Increase to 1000 mg if HbA1c > 7.5"}
```

**Key query pattern:** Find current medicines (where `end_date IS NULL`), detect recent changes (compare `start_date` against a cutoff).

---

### 3. careops_lab_reports

**Purpose:** Lab test results including HbA1c, fasting glucose, and other clinical observations.

**Manifest:** `coral/sources/careops/lab_reports/manifest.yaml`
**Data:** `data/lab_reports.jsonl` (12 rows)

| Column | Type | Description |
|--------|------|-------------|
| `patient_id` | Utf8 | FK to careops_patients |
| `report_date` | Utf8 | Collection/report date |
| `test_name` | Utf8 | Test name |
| `value` | Utf8 | Result value |
| `unit` | Utf8 | Unit |
| `reference_range` | Utf8 | Normal range |
| `lab_name` | Utf8 | Lab name |
| `file_path` | Utf8 | PDF path |

**Sample row:**
```json
{"patient_id":"pat-001","report_date":"2025-06-10","test_name":"HbA1c","value":"7.2","unit":"%","reference_range":"<5.7","lab_name":"Metropolis Labs","file_path":"/data/labs/hba1c_jun2025.pdf"}
```

**Key query pattern:** Get latest result per test name, flag values outside reference range.

---

### 4. careops_doctor_chats

**Purpose:** Doctor instructions parsed from secure messaging or visit summaries. These are the instructions that drive care decisions.

**Manifest:** `coral/sources/careops/doctor_chats/manifest.yaml`
**Data:** `data/doctor_chats.jsonl` (7 rows)

| Column | Type | Description |
|--------|------|-------------|
| `patient_id` | Utf8 | FK to careops_patients |
| `date` | Utf8 | Instruction date |
| `doctor` | Utf8 | Doctor name |
| `message` | Utf8 | Full instruction text |
| `instruction_type` | Utf8 | Category |
| `medicine_mentioned` | Utf8 (nullable) | Referenced medicine |
| `followup_date` | Utf8 (nullable) | Follow-up date |

**Instruction types:** `medicine_change`, `safety_instruction`, `visit_preparation`, `monitoring`

**Sample row:**
```json
{"patient_id":"pat-001","date":"2025-05-20","doctor":"Dr. Sharma","message":"Stop Amlodipine 5 mg. Start Telmisartan 40 mg once daily.","instruction_type":"medicine_change","medicine_mentioned":"Telmisartan","followup_date":"2025-07-01"}
```

---

### 5. careops_pharmacy_receipts

**Purpose:** Pharmacy refill and purchase evidence — proves the patient filled their prescriptions.

**Manifest:** `coral/sources/careops/pharmacy_receipts/manifest.yaml`
**Data:** `data/pharmacy_receipts.jsonl` (11 rows)

| Column | Type | Description |
|--------|------|-------------|
| `patient_id` | Utf8 | FK to careops_patients |
| `date` | Utf8 | Purchase date |
| `medicine` | Utf8 | Medicine dispensed |
| `quantity` | Utf8 | Quantity |
| `amount` | Utf8 | Cost (INR) |
| `pharmacy` | Utf8 | Pharmacy name |
| `receipt_file` | Utf8 | Receipt image path |

**Sample row:**
```json
{"patient_id":"pat-001","date":"2025-06-01","medicine":"Metformin 500 mg","quantity":"60 tablets","amount":"₹180","pharmacy":"Apollo Pharmacy","receipt_file":"/data/receipts/metformin_jun2025.jpg"}
```

---

### 6. careops_symptom_logs

**Purpose:** Symptom tracking records logged by family caregivers, correlated to medicines.

**Manifest:** `coral/sources/careops/symptom_logs/manifest.yaml`
**Data:** `data/symptom_logs.jsonl` (11 rows)

| Column | Type | Description |
|--------|------|-------------|
| `patient_id` | Utf8 | FK to careops_patients |
| `date` | Utf8 | Observation date |
| `symptom` | Utf8 | Symptom description |
| `severity` | Int64 | Rating 1–5 |
| `notes` | Utf8 | Context |
| `related_medicine` | Utf8 | Potentially related medicine |

**Sample row:**
```json
{"patient_id":"pat-001","date":"2025-06-05","symptom":"Dizziness after standing","severity":3,"notes":"Lasts about 2 minutes, usually in morning","related_medicine":"Telmisartan"}
```

---

### 7. careops_appointments

**Purpose:** Upcoming and past medical appointment records.

**Manifest:** `coral/sources/careops/appointments/manifest.yaml`
**Data:** `data/appointments.jsonl` (6 rows)

| Column | Type | Description |
|--------|------|-------------|
| `patient_id` | Utf8 | FK to careops_patients |
| `appointment_date` | Utf8 | Appointment date |
| `doctor` | Utf8 | Doctor name |
| `speciality` | Utf8 | Medical speciality |
| `reason` | Utf8 | Visit reason |
| `status` | Utf8 | scheduled/completed |

**Sample row:**
```json
{"patient_id":"pat-001","appointment_date":"2025-06-28","doctor":"Dr. Sharma","speciality":"Endocrinology","reason":"Diabetes follow-up","status":"scheduled"}
```

---

### 8. careops_prescription_ocr

**Purpose:** OCR-extracted prescription data from physical prescription photos. Represents a real-world data ingestion path.

**Manifest:** `coral/sources/careops/prescription_ocr/manifest.yaml`
**Data:** `data/prescription_ocr.jsonl` (5 rows)

| Column | Type | Description |
|--------|------|-------------|
| `patient_id` | Utf8 | FK to careops_patients |
| `image_file` | Utf8 | Prescription image path |
| `ocr_text` | Utf8 | Raw OCR output |
| `extracted_medicines` | Utf8 | Parsed medicine names |
| `doctor_name` | Utf8 | Prescribing doctor |
| `prescription_date` | Utf8 | Rx date |

**Sample row:**
```json
{"patient_id":"pat-001","image_file":"/data/ocr/rx_jun2025.jpg","ocr_text":"Telmisartan 40 mg\nOne daily\nDr. Sharma","extracted_medicines":"Telmisartan 40 mg","doctor_name":"Dr. Sharma","prescription_date":"2025-06-01"}
```

---

### 9. careops_family_notes

**Purpose:** Free-text notes from family caregivers providing context, observations, and concerns.

**Manifest:** `coral/sources/careops/family_notes/manifest.yaml`
**Data:** `data/family_notes.jsonl` (7 rows)

| Column | Type | Description |
|--------|------|-------------|
| `patient_id` | Utf8 | FK to careops_patients |
| `date` | Utf8 | Note date |
| `note_author` | Utf8 | Family member name |
| `note_text` | Utf8 | Note content |
| `priority` | Utf8 | high/normal |

**Sample row:**
```json
{"patient_id":"pat-001","date":"2025-06-20","note_author":"Priya (daughter)","note_text":"Dad seems more tired than usual, appetite reduced. Blood sugar fasting this morning was 145.","priority":"high"}
```

---

## Cross-Source Joins

The most important query pattern in CareOps is joining across sources. Here is the main join query used for the doctor visit packet:

```sql
SELECT
  m.medicine_name, m.dose, m.frequency, m.start_date,
  l.test_name, l.value, l.report_date,
  d.message, d.instruction_type,
  s.symptom, s.severity, s.date,
  p.medicine, p.date as refill_date,
  n.note_text, n.priority,
  a.appointment_date, a.doctor, a.reason
FROM careops_patients.patients p
LEFT JOIN careops_medications.medications m ON p.patient_id = m.patient_id
LEFT JOIN careops_lab_reports.lab_reports l ON p.patient_id = l.patient_id
LEFT JOIN careops_doctor_chats.doctor_chats d ON p.patient_id = d.patient_id
LEFT JOIN careops_symptom_logs.symptom_logs s ON p.patient_id = s.patient_id
LEFT JOIN careops_pharmacy_receipts.pharmacy_receipts p ON p.patient_id = p.patient_id
LEFT JOIN careops_family_notes.family_notes n ON p.patient_id = n.patient_id
LEFT JOIN careops_appointments.appointments a ON p.patient_id = a.patient_id
WHERE p.patient_id = 'pat-001'
ORDER BY m.start_date DESC, l.report_date DESC, s.date DESC
```

## Query Builders

The typed query builders in `src/lib/coral/careops-queries.ts` provide 8 parameterized SQL templates:

| Function | Sources Used | Purpose |
|----------|-------------|---------|
| `getPatientProfile(id)` | patients | Get patient name, age, condition, doctor |
| `getCurrentMedicines(id)` | medications | Active prescriptions (null end_date) |
| `getMedicineChanges(id, since)` | medications, doctor_chats | Recently started/changed medicines |
| `getRecentLabs(id, days)` | lab_reports | Labs within N days |
| `getRecentSymptoms(id, days)` | symptom_logs | Symptoms within N days |
| `getRefillEvidence(id)` | pharmacy_receipts | Pharmacy refill records |
| `getMissingRecords(id)` | All 9 | Detect absent record types |
| `getCarePacketJoinQuery(id)` | All 9 | Full cross-source JOIN for packet |
