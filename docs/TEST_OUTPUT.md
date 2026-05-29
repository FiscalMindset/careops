# Test Output

## Unit Tests (`npm test`)

**16/16 tests pass** (vitest)

### tests/coral-cli.test.ts (9 tests)

```
✓ Query builder > builds patient profile query
✓ Query builder > builds current medicines query
✓ Query builder > builds recent labs query
✓ Query builder > builds cross-source JOIN query
✓ Output parser > parses a JSON array of objects
✓ Output parser > returns empty columns/rows for empty input
✓ Output parser > returns empty columns/rows for invalid JSON
✓ Patient ID validation > accepts valid alphanumeric IDs
✓ Patient ID validation > rejects SQL injection attempts
```

### tests/careops.test.ts (7 tests)

```
✓ loads synthetic patients and care records
✓ joins medication, symptoms, labs, chats, and refills using SQLite
✓ builds a timeline with multiple source types
✓ generates a diabetes follow-up packet
✓ detects missing BP and weight records for pat-003
✓ maintains safety guardrails
✓ renders markdown with safety disclaimer and SQL
```

## Coral Integration Test (`npm run test:coral`)

Date: Fri May 29 22:03:19 IST 2026

### 1. coral source list

```
Source                     Version  Origin
-------------------------  -------  --------
careops_appointments       0.1.0    imported
careops_doctor_chats       0.1.0    imported
careops_family_notes       0.1.0    imported
careops_lab_reports        0.1.0    imported
careops_medications        0.1.0    imported
careops_patients           0.1.0    imported
careops_pharmacy_receipts  0.1.0    imported
careops_prescription_ocr   0.1.0    imported
careops_symptom_logs       0.1.0    imported
github                     1.1.5    bundled
kairon_live                0.1.0    imported
kairon_scraper             0.1.0    imported
```

**9/9 CareOps sources registered** — all pass their test queries.

### 2. coral sql: patients

```
SELECT * FROM careops_patients.patients LIMIT 3
```
3 rows returned with patient_id, name, age, gender, condition_focus, primary_doctor.

### 3. coral sql: medications

```
SELECT * FROM careops_medications.medications LIMIT 3
```
3 rows returned with patient_id, medicine_name, dose, frequency, start_date, end_date, source, notes.

### 4. coral sql: lab_reports

```
SELECT * FROM careops_lab_reports.lab_reports LIMIT 3
```
3 rows returned with HbA1c (8.1%) and Fasting Glucose (154 mg/dL).

### 5. Cross-source JOIN (JSON output)

```
SELECT p.name, m.medicine_name, m.dose, l.test_name, l.value, s.symptom, s.severity
FROM careops_patients.patients p
JOIN careops_medications.medications m ON m.patient_id = p.patient_id
LEFT JOIN careops_lab_reports.lab_reports l ON l.patient_id = p.patient_id
LEFT JOIN careops_symptom_logs.symptom_logs s ON s.patient_id = p.patient_id
WHERE p.patient_id = 'pat-001' LIMIT 5
```
5 joined rows returned as JSON. Real cross-source JOIN across 4 Coral sources.

## Summary

| Test | Status |
|------|--------|
| Unit tests — coral-cli.test.ts | 9/9 passed |
| Unit tests — careops.test.ts | 7/7 passed |
| coral source list | 9 CareOps sources registered |
| coral sql: patients | 3 rows |
| coral sql: medications | 3 rows |
| coral sql: lab_reports | 3 rows |
| coral sql: cross-source JOIN | 5 rows from 4 sources |
| CAREOPS_QUERY_MODE=coral_cli | Default mode |
| SQLite/Mock fallback | Available for tests only |
