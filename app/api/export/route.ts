import { NextRequest, NextResponse } from "next/server";
import { generateDoctorVisitPacket } from "@/lib/agent/careops-agent";
import { packetToMarkdown, writePacketMarkdown } from "@/lib/export/markdown";

export async function GET(request: NextRequest) {
  const patientId = request.nextUrl.searchParams.get("patientId") ?? "pat-001";
  const purpose = request.nextUrl.searchParams.get("purpose") ?? "diabetes follow-up";
  const download = request.nextUrl.searchParams.get("download");
  const packet = await generateDoctorVisitPacket(patientId, purpose);

  if (download === "1") {
    return new NextResponse(packetToMarkdown(packet), {
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Content-Disposition": `attachment; filename="${patientId}-doctor-visit-packet.md"`
      }
    });
  }

  const result = await writePacketMarkdown(packet);
  return NextResponse.json({ ok: true, fileName: result.fileName, exportPath: result.exportPath });
}
