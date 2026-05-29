import { describe, expect, it, beforeAll } from "vitest";
import { loadCareOpsData } from "@/lib/data/load-careops-data";
import { assertSafetyBoundary, generateDoctorVisitPacket } from "@/lib/agent/careops-agent";
import { packetToMarkdown } from "@/lib/export/markdown";
import { CoralClient } from "@/lib/coral/client";
import {
  getCarePacketJoinQuery,
  getPatientProfileQuery,
  getCurrentMedicinesQuery,
  getRecentLabsQuery,
  getSymptomTimelineQuery,
  getPharmacyRefillsQuery,
  getAppointmentQuery,
  getFamilyNotesQuery,
} from "@/lib/coral/careops-queries";

beforeAll(() => {
  process.env.CAREOPS_QUERY_MODE = "sqlite";
  process.env.DATABASE_URL = "file:./careops.db";
});

describe("CareOps data loading", () => {
  it("loads synthetic patients and care records", async () => {
    const data = await loadCareOpsData();
    expect(data.patients.length).toBeGreaterThanOrEqual(1);
    expect(data.medications.some((med) => med.patient_id === "pat-001")).toBe(true);
  });
});

describe("Coral SQL query execution (SQLite)", () => {
  it("runs care packet join query using Coral-style table names", async () => {
    const coral = new CoralClient();
    const sql = getCarePacketJoinQuery("pat-001");
    const resp = await coral.executeQuery(sql);
    expect(resp.result!.rows.length).toBeGreaterThan(0);
    expect(resp.result!.columns).toContain("test_name");
    expect(resp.result!.columns).toContain("medicine_name");
  });

  it("runs patient profile query", async () => {
    const coral = new CoralClient();
    const sql = getPatientProfileQuery("pat-001");
    const resp = await coral.executeQuery(sql);
    expect(resp.result!.rows.length).toBe(1);
    expect(resp.result!.rows[0][1]).toBe("Raman Mehta");
  });

  it("runs medicines query", async () => {
    const coral = new CoralClient();
    const sql = getCurrentMedicinesQuery("pat-001");
    const resp = await coral.executeQuery(sql);
    expect(resp.result!.rows.length).toBeGreaterThanOrEqual(2);
    const names = resp.result!.rows.map((r: any[]) => r[0]);
    expect(names).toContain("Metformin");
  });

  it("runs labs query", async () => {
    const coral = new CoralClient();
    const sql = getRecentLabsQuery("pat-001");
    const resp = await coral.executeQuery(sql);
    expect(resp.result!.rows.length).toBeGreaterThanOrEqual(2);
    const tests = resp.result!.rows.map((r: any[]) => r[1]);
    expect(tests).toContain("HbA1c");
  });

  it("runs symptom timeline query", async () => {
    const coral = new CoralClient();
    const sql = getSymptomTimelineQuery("pat-001");
    const resp = await coral.executeQuery(sql);
    expect(resp.result!.rows.length).toBeGreaterThan(0);
  });

  it("runs pharmacy refills query", async () => {
    const coral = new CoralClient();
    const sql = getPharmacyRefillsQuery("pat-001");
    const resp = await coral.executeQuery(sql);
    expect(resp.result!.rows.length).toBeGreaterThan(0);
  });

  it("runs appointments query", async () => {
    const coral = new CoralClient();
    const sql = getAppointmentQuery("pat-001");
    const resp = await coral.executeQuery(sql);
    expect(resp.result!.rows.length).toBeGreaterThan(0);
  });

  it("runs family notes query", async () => {
    const coral = new CoralClient();
    const sql = getFamilyNotesQuery("pat-001");
    const resp = await coral.executeQuery(sql);
    expect(resp.result!.rows.length).toBeGreaterThan(0);
  });
});

describe("Packet generation", () => {
  it("generates a diabetes follow-up packet", async () => {
    const packet = await generateDoctorVisitPacket("pat-001", "diabetes follow-up");
    expect(packet.currentMedicines.map((med) => med.medicine_name)).toContain("Sitagliptin");
    expect(packet.recentLabs.some((lab) => lab.test_name === "HbA1c")).toBe(true);
    expect(packet.questions.length).toBeGreaterThan(0);
  });

  it("detects missing BP and weight records for pat-003", async () => {
    // pat-003 has no family notes in the synthetic data that mention BP and weight
    const packet = await generateDoctorVisitPacket("pat-003", "reconciliation");
    expect(packet.missingRecords.join(" ")).toContain("BP");
    expect(packet.missingRecords.join(" ")).toContain("weight");
  });

  it("maintains safety guardrails", async () => {
    const packet = await generateDoctorVisitPacket("pat-001", "diabetes follow-up");
    const text = JSON.stringify(packet);
    expect(assertSafetyBoundary(text)).toBe(true);
    expect(text.toLowerCase()).not.toContain("diagnosis is");
  });
});

describe("Export generation", () => {
  it("renders markdown with safety disclaimer and SQL", async () => {
    const packet = await generateDoctorVisitPacket("pat-001", "diabetes follow-up");
    const markdown = packetToMarkdown(packet);
    expect(markdown).toContain("This is not medical advice");
    expect(markdown).toContain("Coral SQL Evidence");
    expect(markdown).toContain("SELECT");
  });
});
