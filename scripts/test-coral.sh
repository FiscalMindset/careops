#!/usr/bin/env bash
set -euo pipefail

echo "=== Coral Integration Test ==="
echo "Date: $(date)"
echo ""

echo "--- 1. coral source list ---"
coral source list 2>&1
echo ""

echo "--- 2. coral sql: patients ---"
coral sql "SELECT * FROM careops_patients.patients LIMIT 3" 2>&1
echo ""

echo "--- 3. coral sql: medications ---"
coral sql "SELECT * FROM careops_medications.medications LIMIT 3" 2>&1
echo ""

echo "--- 4. coral sql: lab_reports ---"
coral sql "SELECT * FROM careops_lab_reports.lab_reports LIMIT 3" 2>&1
echo ""

echo "--- 5. coral sql: cross-source JOIN ---"
coral sql --format json "SELECT p.name, m.medicine_name, m.dose, l.test_name, l.value, s.symptom, s.severity FROM careops_patients.patients p JOIN careops_medications.medications m ON m.patient_id = p.patient_id LEFT JOIN careops_lab_reports.lab_reports l ON l.patient_id = p.patient_id LEFT JOIN careops_symptom_logs.symptom_logs s ON s.patient_id = p.patient_id WHERE p.patient_id = 'pat-001' LIMIT 5" 2>&1
echo ""

echo "=== All Coral integration tests passed ==="
