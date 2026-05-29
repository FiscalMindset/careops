import Database from "better-sqlite3";
import path from "path";
import { runCoralSql, checkCoralAvailable } from "./coral-cli-client";
import { parseCoralJsonResult } from "./coral-output-parser";

export type QueryMode = "coral_cli" | "mock" | "sqlite";

export interface CoralQueryResult {
  columns: string[];
  rows: any[][];
}

export interface CoralExecutionMeta {
  mode: QueryMode;
  command: string;
  rawOutput: string;
  durationMs: number;
}

export interface CoralQueryResponse {
  result: CoralQueryResult | null;
  meta: CoralExecutionMeta;
  error: string | null;
}

function getMode(): QueryMode {
  const env = process.env.CAREOPS_QUERY_MODE || "coral_cli";
  if (env === "sqlite") return "sqlite";
  if (env === "mock") return "mock";
  return "coral_cli";
}

export class CoralClient {
  private mode: QueryMode;
  private db: any = null;
  private _coralAvailable: boolean | null = null;

  constructor() {
    this.mode = getMode();
    if (this.mode === "sqlite" || this.mode === "mock") {
      if (typeof window === "undefined") {
        const dbPath = process.env.DATABASE_URL?.replace("file:", "") || "./careops.db";
        this.db = new Database(path.resolve(process.cwd(), dbPath));
      }
    }
  }

  get executionMode(): QueryMode {
    return this.mode;
  }

  async isCoralAvailable(): Promise<boolean> {
    if (this._coralAvailable === null) {
      this._coralAvailable = await checkCoralAvailable();
    }
    return this._coralAvailable;
  }

  async executeQuery(sql: string, params: any[] = []): Promise<CoralQueryResponse> {
    const t0 = performance.now();

    switch (this.mode) {
      case "coral_cli":
        return this.executeCoralCliQuery(sql);
      case "mock":
        return this.executeMockQuery(sql, params);
      case "sqlite":
        return this.executeMockQuery(sql, params);
      default:
        return this.executeCoralCliQuery(sql);
    }
  }

  private async executeCoralCliQuery(sql: string): Promise<CoralQueryResponse> {
    const t0 = performance.now();
    try {
      const available = await this.isCoralAvailable();
      if (!available) {
        return {
          result: null,
          meta: { mode: "coral_cli", command: "", rawOutput: "", durationMs: Math.round(performance.now() - t0) },
          error: "Coral CLI not available. Install with: npm install -g @withcoral/cli",
        };
      }

      const { stdout, stderr, command } = await runCoralSql(sql, "json");
      const parsed = parseCoralJsonResult(stdout);

      const columns = parsed.columns;
      const rows = parsed.rows.map((row) => columns.map((col) => row[col]));

      return {
        result: { columns, rows },
        meta: {
          mode: "coral_cli",
          command,
          rawOutput: stdout,
          durationMs: Math.round(performance.now() - t0),
        },
        error: stderr || null,
      };
    } catch (err: any) {
      return {
        result: null,
        meta: {
          mode: "coral_cli",
          command: `coral sql --format json ...`,
          rawOutput: "",
          durationMs: Math.round(performance.now() - t0),
        },
        error: `Coral execution failed: ${err.message}`,
      };
    }
  }

  private executeMockQuery(sql: string, params: any[]): CoralQueryResponse {
    const t0 = performance.now();
    try {
      if (!this.db) {
        return {
          result: null,
          meta: { mode: this.mode, command: "", rawOutput: "", durationMs: Math.round(performance.now() - t0) },
          error: "Mock database not initialized. Server-side only.",
        };
      }

      const stmt = this.db.prepare(sql);
      const rows = stmt.all(...params);

      if (rows.length === 0) {
        return {
          result: { columns: [], rows: [] },
          meta: {
            mode: this.mode,
            command: sql,
            rawOutput: JSON.stringify([]),
            durationMs: Math.round(performance.now() - t0),
          },
          error: null,
        };
      }

      const columns = Object.keys(rows[0]);
      const mappedRows = rows.map((row: any) => columns.map((col) => row[col]));

      return {
        result: { columns, rows: mappedRows },
        meta: {
          mode: this.mode,
          command: sql,
          rawOutput: JSON.stringify(rows),
          durationMs: Math.round(performance.now() - t0),
        },
        error: null,
      };
    } catch (err: any) {
      return {
        result: null,
        meta: {
          mode: this.mode,
          command: sql,
          rawOutput: "",
          durationMs: Math.round(performance.now() - t0),
        },
        error: err.message,
      };
    }
  }
}
