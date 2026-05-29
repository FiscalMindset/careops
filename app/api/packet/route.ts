import { NextRequest, NextResponse } from "next/server";
import { generateDoctorVisitPacket } from "@/lib/agent/careops-agent";

export async function GET(request: NextRequest) {
  const patientId = request.nextUrl.searchParams.get("patientId") ?? "pat-001";
  const purpose = request.nextUrl.searchParams.get("purpose") ?? "diabetes follow-up";

  try {
    const packet = await generateDoctorVisitPacket(patientId, purpose);
    return NextResponse.json(packet);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to generate packet" }, { status: 500 });
  }
}
