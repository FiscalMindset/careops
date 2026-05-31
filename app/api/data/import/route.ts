import { NextRequest, NextResponse } from "next/server";
import { importData, getSourceManifest } from "@/lib/data/data-importer";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const sourceKey = formData.get("sourceKey") as string | null;
    const file = formData.get("file") as File | null;

    if (!sourceKey || !file) {
      return NextResponse.json({ error: "sourceKey and file are required" }, { status: 400 });
    }

    const manifest = getSourceManifest(sourceKey);
    if (!manifest) {
      return NextResponse.json({ error: `Unknown source: ${sourceKey}` }, { status: 400 });
    }

    const content = await file.text();
    const result = await importData(sourceKey, content, file.name);

    if (!result.success) {
      return NextResponse.json(result, { status: 422 });
    }

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
