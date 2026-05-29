import fs from "node:fs/promises";
import path from "node:path";
import { parse } from "csv-parse/sync";

export async function loadCsv<T>(fileName: string): Promise<T[]> {
  const csvPath = path.join(process.cwd(), "data", fileName);
  const content = await fs.readFile(csvPath, "utf8");
  return parse(content, {
    columns: true,
    skip_empty_lines: true,
    trim: true
  }) as T[];
}
