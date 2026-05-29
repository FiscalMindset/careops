export const DOCTOR_VISIT_PACKET_QUERY = `
SELECT
  m.patient_id,
  m.medicine_name,
  m.dose,
  m.frequency,
  m.start_date,
  s.symptom,
  s.severity,
  s.date AS symptom_date,
  l.test_name,
  l.value,
  l.unit,
  l.report_date,
  d.message AS doctor_instruction,
  p.quantity AS refill_quantity,
  p.date AS refill_date
FROM careops_medications_spec m
LEFT JOIN careops_symptom_logs_spec s
  ON s.patient_id = m.patient_id
  AND s.date >= m.start_date
LEFT JOIN careops_lab_reports_spec l
  ON l.patient_id = m.patient_id
LEFT JOIN careops_doctor_chats_spec d
  ON d.patient_id = m.patient_id
  AND (
    d.medicine_mentioned = m.medicine_name
    OR d.message LIKE '%' || m.medicine_name || '%'
  )
LEFT JOIN careops_pharmacy_receipts_spec p
  ON p.patient_id = m.patient_id
  AND p.medicine LIKE '%' || m.medicine_name || '%'
WHERE m.patient_id = ?
ORDER BY m.start_date DESC, l.report_date DESC, s.date DESC;
`;

export const CAREOPS_JOIN_SQL = DOCTOR_VISIT_PACKET_QUERY;

export const PATIENT_SUMMARY_QUERY = `
SELECT 
  p.patient_id, 
  p.name, 
  p.age, 
  p.condition_focus,
  p.primary_doctor,
  a.appointment_date,
  a.doctor as appointment_doctor,
  a.reason as appointment_reason
FROM careops_patients_spec p
LEFT JOIN careops_appointments_spec a ON a.patient_id = p.patient_id
WHERE p.patient_id = ?
ORDER BY a.appointment_date DESC
LIMIT 1;
`;

export const TIMELINE_QUERY = `
SELECT 'medication' as type, start_date as date, medicine_name as description, notes as extra 
FROM careops_medications_spec WHERE patient_id = ?
UNION ALL
SELECT 'lab' as type, report_date as date, test_name || ' (' || value || ' ' || unit || ')' as description, '' as extra 
FROM careops_lab_reports_spec WHERE patient_id = ?
UNION ALL
SELECT 'symptom' as type, date, symptom || ' (Severity: ' || severity || ')' as description, notes as extra 
FROM careops_symptom_logs_spec WHERE patient_id = ?
UNION ALL
SELECT 'chat' as type, date, 'Doctor instruction: ' || message as description, '' as extra 
FROM careops_doctor_chats_spec WHERE patient_id = ?
UNION ALL
SELECT 'refill' as type, date, 'Refill: ' || medicine || ' (' || quantity || ')' as description, pharmacy as extra 
FROM careops_pharmacy_receipts_spec WHERE patient_id = ?
ORDER BY date DESC;
`;
