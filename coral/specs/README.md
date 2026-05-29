# Custom Coral Source Specs

This directory contains the documentation for custom Coral MCP source specs created for the CareOps Agent. 

In a production environment, you would use Coral's SDK or UI to define these specs against your real data sources (e.g. Postgres databases, external APIs). For this Hackathon project, we have defined the following schemas which are loaded into a local SQLite database for mock testing:

1. `careops_patients_spec` - Maps patient profile records.
2. `careops_medications_spec` - Maps medication history and prescriptions.
3. `careops_lab_reports_spec` - Maps lab results and test observations.
4. `careops_doctor_chats_spec` - Maps instructions and messages from doctors.
5. `careops_pharmacy_receipts_spec` - Maps pharmacy refill and purchase evidence.
6. `careops_symptom_logs_spec` - Maps symptom history reported by family.
7. `careops_appointments_spec` - Maps upcoming and past appointments.
8. `careops_prescription_ocr_spec` - Maps OCR-extracted data from physical prescription images.
9. `careops_family_notes_spec` - Maps context and notes provided by the family caregiver.

See `/docs/SPECS.md` for detailed schemas, example rows, and test queries for each.
