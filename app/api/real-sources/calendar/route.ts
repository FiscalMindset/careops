import { NextResponse } from "next/server";
import { importAppointmentsFromCalendar } from "@/lib/real-sources/calendar-connector";

export async function POST() {
  try {
    const result = await importAppointmentsFromCalendar();
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json(
      { success: false, sourceLabel: "Google Calendar", recordsImported: 0, targetTable: "appointments", errors: [err.message], warnings: [] },
      { status: 500 }
    );
  }
}
