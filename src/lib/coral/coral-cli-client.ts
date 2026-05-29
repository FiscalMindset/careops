import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

const CORAL_BIN = process.env.CORAL_CLI_PATH || "coral";
const CORAL_TIMEOUT = parseInt(process.env.CORAL_CLI_TIMEOUT || "20000", 10);

export interface CoralCliResult {
  stdout: string;
  stderr: string;
  command: string;
}

export async function runCoralSql(sql: string, format: "table" | "json" = "json"): Promise<CoralCliResult> {
  const args = format === "json" ? ["sql", "--format", "json", sql] : ["sql", sql];
  const { stdout, stderr } = await execFileAsync(CORAL_BIN, args, {
    timeout: CORAL_TIMEOUT,
    maxBuffer: 1024 * 1024 * 10,
  });
  return { stdout, stderr, command: `coral sql --format ${format} ${JSON.stringify(sql)}` };
}

export async function runCoralSourceList(): Promise<CoralCliResult> {
  const { stdout, stderr } = await execFileAsync(CORAL_BIN, ["source", "list"], {
    timeout: 15000,
    maxBuffer: 1024 * 1024 * 5,
  });
  return { stdout, stderr, command: "coral source list" };
}

export async function runCoralSourceTest(sourceName: string): Promise<CoralCliResult> {
  const { stdout, stderr } = await execFileAsync(CORAL_BIN, ["source", "test", sourceName], {
    timeout: 15000,
    maxBuffer: 1024 * 1024 * 5,
  });
  return { stdout, stderr, command: `coral source test ${sourceName}` };
}

export async function runCoralSourceLint(manifestPath: string): Promise<CoralCliResult> {
  const { stdout, stderr } = await execFileAsync(CORAL_BIN, ["source", "lint", manifestPath], {
    timeout: 15000,
    maxBuffer: 1024 * 1024 * 5,
  });
  return { stdout, stderr, command: `coral source lint ${manifestPath}` };
}

export async function runCoralSourceAdd(manifestPath: string): Promise<CoralCliResult> {
  const { stdout, stderr } = await execFileAsync(CORAL_BIN, ["source", "add", "--file", manifestPath], {
    timeout: 15000,
    maxBuffer: 1024 * 1024 * 5,
  });
  return { stdout, stderr, command: `coral source add --file ${manifestPath}` };
}

export async function runCoralCommand(args: string[]): Promise<CoralCliResult> {
  const { stdout, stderr } = await execFileAsync(CORAL_BIN, args, {
    timeout: CORAL_TIMEOUT,
    maxBuffer: 1024 * 1024 * 10,
  });
  return { stdout, stderr, command: `coral ${args.join(" ")}` };
}

export async function checkCoralAvailable(): Promise<boolean> {
  try {
    await execFileAsync(CORAL_BIN, ["--version"], { timeout: 5000 });
    return true;
  } catch {
    return false;
  }
}
