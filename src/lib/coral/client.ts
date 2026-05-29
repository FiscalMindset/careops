import Database from "better-sqlite3";
import path from "path";

export interface CoralQueryResult {
  columns: string[];
  rows: any[][];
}

export class CoralClient {
  private useMock: boolean;
  private db: any = null;

  constructor() {
    this.useMock = process.env.NEXT_PUBLIC_USE_MOCK_CORAL === "true";
    if (this.useMock) {
      if (typeof window === "undefined") {
        // Node environment: use better-sqlite3 for local mock
        const dbPath = process.env.DATABASE_URL?.replace("file:", "") || "./careops.db";
        this.db = new Database(path.resolve(process.cwd(), dbPath));
      }
    }
  }

  async executeQuery(sql: string, params: any[] = []): Promise<CoralQueryResult> {
    if (this.useMock) {
      return this.executeMockQuery(sql, params);
    } else {
      return this.executeRealCoralQuery(sql, params);
    }
  }

  private async executeMockQuery(sql: string, params: any[]): Promise<CoralQueryResult> {
    if (!this.db) {
      throw new Error("Mock database is not initialized. Ensure you are running on the server.");
    }

    try {
      // better-sqlite3 uses ? for positional params
      const stmt = this.db.prepare(sql);
      const rows = stmt.all(...params);

      if (rows.length === 0) {
        return { columns: [], rows: [] };
      }

      const columns = Object.keys(rows[0]);
      const mappedRows = rows.map((row: any) => columns.map(col => row[col]));
      
      return { columns, rows: mappedRows };
    } catch (error) {
      console.error("Mock Coral SQL Error:", error);
      throw error;
    }
  }

  private async executeRealCoralQuery(sql: string, params: any[]): Promise<CoralQueryResult> {
    const serverUrl = process.env.CORAL_MCP_SERVER_URL;
    if (!serverUrl) {
      throw new Error("CORAL_MCP_SERVER_URL is required when mock mode is disabled.");
    }

    // In a real implementation, we would bridge to the MCP server.
    // For this hackathon project, we simulate the fetch to a potential MCP HTTP proxy.
    const res = await fetch(`${serverUrl}/query`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.CORAL_API_KEY || ""}`
      },
      body: JSON.stringify({ query: sql, params })
    });

    if (!res.ok) {
      throw new Error(`Coral MCP error: ${res.statusText}`);
    }
    
    return await res.json();
  }
}
