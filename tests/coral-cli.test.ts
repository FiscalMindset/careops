import { describe, expect, it } from "vitest";
import { getCarePacketJoinQuery, getPatientProfileQuery, getCurrentMedicinesQuery, getRecentLabsQuery, getDoctorInstructionsQuery, getSymptomTimelineQuery, getPharmacyRefillsQuery, getAppointmentQuery, getFamilyNotesQuery } from "@/lib/coral/careops-queries";
import { parseCoralJsonResult, parseCoralSourceList } from "@/lib/coral/coral-output-parser";

describe("Coral CLI query builder", () => {
  it("builds patient profile query with escaped ID", () => {
    const sql = getPatientProfileQuery("pat-001");
    expect(sql).toContain("WHERE patient_id = 'pat-001'");
    expect(sql).toContain("careops_patients.patients");
  });

  it("rejects invalid patient IDs", () => {
    expect(() => getPatientProfileQuery("pat-001'; DROP TABLE")).toThrow("Invalid patient ID");
    expect(() => getPatientProfileQuery("../etc/passwd")).toThrow("Invalid patient ID");
  });

  it("builds care packet join query with correct table names", () => {
    const sql = getCarePacketJoinQuery("pat-001");
    expect(sql).toContain("careops_medications.medications");
    expect(sql).toContain("careops_symptom_logs.symptom_logs");
    expect(sql).toContain("careops_lab_reports.lab_reports");
    expect(sql).toContain("careops_doctor_chats.doctor_chats");
    expect(sql).toContain("careops_pharmacy_receipts.pharmacy_receipts");
    expect(sql).toContain("careops_appointments.appointments");
    expect(sql).toContain("careops_family_notes.family_notes");
    expect(sql).toContain("WHERE m.patient_id = 'pat-001'");
  });

  it("builds individual source queries", () => {
    expect(getCurrentMedicinesQuery("pat-001")).toContain("careops_medications.medications");
    expect(getRecentLabsQuery("pat-001")).toContain("careops_lab_reports.lab_reports");
    expect(getDoctorInstructionsQuery("pat-001")).toContain("careops_doctor_chats.doctor_chats");
    expect(getSymptomTimelineQuery("pat-001")).toContain("careops_symptom_logs.symptom_logs");
    expect(getPharmacyRefillsQuery("pat-001")).toContain("careops_pharmacy_receipts.pharmacy_receipts");
    expect(getAppointmentQuery("pat-001")).toContain("careops_appointments.appointments");
    expect(getFamilyNotesQuery("pat-001")).toContain("careops_family_notes.family_notes");
  });
});

describe("Coral output parser", () => {
  it("parses JSON result from coral sql --format json", () => {
    const stdout = '[{"patient_id":"pat-001","name":"Raman Mehta","age":68}]';
    const parsed = parseCoralJsonResult(stdout);
    expect(parsed.columns).toEqual(["patient_id", "name", "age"]);
    expect(parsed.rows).toHaveLength(1);
    expect(parsed.rows[0].name).toBe("Raman Mehta");
  });

  it("returns empty for empty JSON array", () => {
    const parsed = parseCoralJsonResult("[]");
    expect(parsed.columns).toEqual([]);
    expect(parsed.rows).toEqual([]);
  });

  it("returns empty for invalid JSON", () => {
    const parsed = parseCoralJsonResult("not json");
    expect(parsed.columns).toEqual([]);
  });

  it("parses coral source list output", () => {
    const stdout = `Source                     Version  Origin
-------------------------  -------  --------
careops_patients           0.1.0    imported
careops_medications        0.1.0    imported
github                     1.1.5    bundled`;
    const parsed = parseCoralSourceList(stdout);
    expect(parsed.sources).toHaveLength(3);
    expect(parsed.sources[0].name).toBe("careops_patients");
    expect(parsed.sources[0].version).toBe("0.1.0");
    expect(parsed.sources[0].origin).toBe("imported");
  });

  it("handles empty source list", () => {
    const parsed = parseCoralSourceList("");
    expect(parsed.sources).toEqual([]);
  });
});


