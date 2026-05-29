export interface ParsedCoralTable {
  columns: string[];
  rows: Record<string, string>[];
}

export interface ParsedSourceList {
  sources: { name: string; version: string; origin: string }[];
}

export function parseCoralJsonResult(stdout: string): ParsedCoralTable {
  try {
    const rows = JSON.parse(stdout.trim());
    if (!Array.isArray(rows) || rows.length === 0) {
      return { columns: [], rows: [] };
    }
    const columns = Object.keys(rows[0]);
    return { columns, rows };
  } catch {
    return { columns: [], rows: [] };
  }
}

export function parseCoralSourceList(stdout: string): ParsedSourceList {
  const lines = stdout.trim().split("\n");
  const sources: { name: string; version: string; origin: string }[] = [];

  // Skip header lines until we find the separator line
  let start = false;
  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed.startsWith("---")) {
      start = true;
      continue;
    }

    if (!start || !trimmed) continue;

    const parts = trimmed.split(/\s{2,}/);
    if (parts.length >= 3) {
      sources.push({
        name: parts[0].trim(),
        version: parts[1].trim(),
        origin: parts[2].trim(),
      });
    }
  }

  return { sources };
}
