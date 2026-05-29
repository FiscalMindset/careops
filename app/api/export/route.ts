import { NextRequest, NextResponse } from "next/server";
import { generateDoctorVisitPacket } from "@/lib/agent/careops-agent";
import { packetToMarkdown, writePacketMarkdown } from "@/lib/export/markdown";
import fs from "node:fs/promises";
import path from "node:path";

const EXPORT_DIR = path.join(process.cwd(), "exports");

async function listFiles() {
  const files = await fs.readdir(EXPORT_DIR).catch(() => []);
  const markdownFiles = files.filter((f) => f.endsWith(".md"));
  const result = [];
  for (const name of markdownFiles) {
    try {
      const stat = await fs.stat(path.join(EXPORT_DIR, name));
      result.push({
        name,
        path: `/exports/${name}`,
        size: stat.size,
        modifiedAt: stat.mtime.toISOString().split("T")[0],
      });
    } catch {}
  }
  result.sort((a, b) => b.modifiedAt.localeCompare(a.modifiedAt));
  return result;
}

async function getFileContent(name: string): Promise<string | null> {
  const safe = path.basename(name);
  try {
    return await fs.readFile(path.join(EXPORT_DIR, safe), "utf-8");
  } catch {
    return null;
  }
}

async function deleteFile(name: string): Promise<boolean> {
  const safe = path.basename(name);
  try {
    await fs.unlink(path.join(EXPORT_DIR, safe));
    return true;
  } catch {
    return false;
  }
}

export async function GET(request: NextRequest) {
  const list = request.nextUrl.searchParams.get("list");
  const fileName = request.nextUrl.searchParams.get("file");
  const download = request.nextUrl.searchParams.get("download");

  if (list === "true") {
    const files = await listFiles();
    return NextResponse.json({ files });
  }

  if (fileName) {
    const content = await getFileContent(fileName);
    if (content === null) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }
    if (download === "true") {
      return new NextResponse(content, {
        headers: {
          "Content-Type": "text/markdown; charset=utf-8",
          "Content-Disposition": `attachment; filename="${fileName}"`,
        },
      });
    }
    return NextResponse.json({ name: fileName, content });
  }

  const patientId = request.nextUrl.searchParams.get("patientId") ?? "pat-001";
  const purpose = request.nextUrl.searchParams.get("purpose") ?? "diabetes follow-up";
  const packet = await generateDoctorVisitPacket(patientId, purpose);

  if (download === "1") {
    return new NextResponse(packetToMarkdown(packet), {
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Content-Disposition": `attachment; filename="${patientId}-doctor-visit-packet.md"`,
      },
    });
  }

  const result = await writePacketMarkdown(packet);
  return NextResponse.json({ ok: true, fileName: result.fileName, exportPath: result.exportPath });
}

export async function DELETE(request: NextRequest) {
  const fileName = request.nextUrl.searchParams.get("delete");
  if (!fileName) {
    return NextResponse.json({ error: "file query param required" }, { status: 400 });
  }
  const ok = await deleteFile(fileName);
  return NextResponse.json({ ok });
}
