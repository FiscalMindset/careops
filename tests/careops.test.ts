import { describe, expect, it, beforeAll } from "vitest";
import { loadCareOpsData } from "@/lib/data/load-careops-data";
import { assertSafetyBoundary, generateDoctorVisitPacket } from "@/lib/agent/careops-agent";
import { packetToMarkdown } from "@/lib/export/markdown";
import { CoralClient } from "@/lib/coral/client";
import { DOCTOR_VISIT_PACKET_QUERY, TIMELINE_QUERY } from "@/lib/coral/queries";

beforeAll(() => {
  process.env.NEXT_PUBLIC_USE_MOCK_CORAL = "true";
  process.env.DATABASE_URL = "file:./careops.db";
});

describe("CareOps data loading", () => {
  it("loads synthetic patients and care records", async () => {
    const data = await loadCareOpsData();
    expect(data.patients.length).toBeGreaterThanOrEqual(1);
    expect(data.medications.some((med) => med.patient_id === "pat-001")).toBe(true);
  });
});

describe("Coral SQL query execution (Mock)", () => {
  it("joins medication, symptoms, labs, chats, and refills using SQLite", async () => {
    const coral = new CoralClient();
    const result = await coral.executeQuery(DOCTOR_VISIT_PACKET_QUERY, ["pat-001"]);
    expect(result.rows.length).toBeGreaterThan(0);
    expect(result.columns).toContain("test_name");
  });
});

describe("Patient timeline join", () => {
  it("builds a timeline with multiple source types", async () => {
    const coral = new CoralClient();
    const result = await coral.executeQuery(TIMELINE_QUERY, ["pat-001", "pat-001", "pat-001", "pat-001", "pat-001"]);
    
    // Column 0 is 'type'
    const types = new Set(result.rows.map((row) => row[0]));
    expect(types.size).toBeGreaterThanOrEqual(3);
    expect(types.has("lab")).toBe(true);
    expect(types.has("refill")).toBe(true);
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
