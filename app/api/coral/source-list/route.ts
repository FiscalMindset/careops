import { NextResponse } from "next/server";
import { runCoralSourceList } from "@/lib/coral/coral-cli-client";
import { parseCoralSourceList } from "@/lib/coral/coral-output-parser";

export async function GET() {
  try {
    const { stdout, command } = await runCoralSourceList();
    const parsed = parseCoralSourceList(stdout);

    return NextResponse.json({
      mode: "coral_cli",
      command,
      rawOutput: stdout,
      sources: parsed.sources,
      sourceCount: parsed.sources.length,
      careOpsSources: parsed.sources.filter((s) => s.name.startsWith("careops_")),
      careOpsCount: parsed.sources.filter((s) => s.name.startsWith("careops_")).length,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        mode: "coral_cli",
        error: `Coral CLI execution failed: ${error.message}`,
        sources: [],
        sourceCount: 0,
        careOpsSources: [],
        careOpsCount: 0,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
