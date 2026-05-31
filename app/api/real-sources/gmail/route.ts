import { NextResponse } from "next/server";
import { importDoctorEmailsFromGmail } from "@/lib/real-sources/gmail-connector";

export async function POST() {
  try {
    const result = await importDoctorEmailsFromGmail();
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json(
      { success: false, sourceLabel: "Gmail", recordsImported: 0, targetTable: "doctor_chats", errors: [err.message], warnings: [] },
      { status: 500 }
    );
  }
}
