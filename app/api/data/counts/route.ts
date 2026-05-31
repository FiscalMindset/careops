import { NextResponse } from "next/server";
import { getSourceRecordCounts } from "@/lib/data/data-importer";

export async function GET() {
  try {
    const counts = await getSourceRecordCounts();
    return NextResponse.json({ counts });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
