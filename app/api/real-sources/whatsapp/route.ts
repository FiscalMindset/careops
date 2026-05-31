import { NextRequest, NextResponse } from "next/server";
import { parseWhatsAppExport, formatAsDoctorChatRecord, formatAsFamilyNoteRecord } from "@/lib/real-sources/whatsapp-parser";
import { appendJsonl, overwriteCsv, getSourceManifest, reseedDatabase } from "@/lib/data/data-importer";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ success: false, error: "No file provided" }, { status: 400 });
    }

    const text = await file.text();
    const { doctorChats, familyNotes } = parseWhatsAppExport(text);

    const warnings: string[] = [];
    let doctorImported = 0;
    let notesImported = 0;

    const chatManifest = getSourceManifest("doctorChats");
    const notesManifest = getSourceManifest("familyNotes");

    if (chatManifest && doctorChats.length > 0) {
      const records = doctorChats.map(formatAsDoctorChatRecord);
      await appendJsonl(records, chatManifest.jsonlFile);
      await overwriteCsv(chatManifest);
      doctorImported = records.length;
    }

    if (notesManifest && familyNotes.length > 0) {
      const records = familyNotes.map(formatAsFamilyNoteRecord);
      await appendJsonl(records, notesManifest.jsonlFile);
      await overwriteCsv(notesManifest);
      notesImported = records.length;
    }

    if (doctorImported > 0 || notesImported > 0) {
      const seedResult = await reseedDatabase();
      if (!seedResult.success) {
        warnings.push(`DB reseed failed: ${seedResult.error}`);
      }
    }

    return NextResponse.json({
      success: true,
      doctorChatsImported: doctorImported,
      familyNotesImported: notesImported,
      totalMessages: doctorImported + notesImported,
      warnings,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
