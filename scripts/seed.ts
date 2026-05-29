process.env.NEXT_PUBLIC_USE_MOCK_CORAL = process.env.NEXT_PUBLIC_USE_MOCK_CORAL || "true";
process.env.DATABASE_URL = process.env.DATABASE_URL || "file:./careops.db";
import Database from "better-sqlite3";
import fs from "fs";
import { loadCareOpsData } from "../src/lib/data/load-careops-data";

async function main() {
  const dbFile = "careops.db";
  if (fs.existsSync(dbFile)) {
    fs.unlinkSync(dbFile);
    console.log(`Deleted existing ${dbFile}`);
  }

  const db = new Database(dbFile);
  console.log(`Created new ${dbFile}`);

  const data = await loadCareOpsData();

  const insertTable = (tableName: string, rows: any[]) => {
    if (rows.length === 0) return;
    const columns = Object.keys(rows[0]);
    
    // Create table
    const createTableSql = `CREATE TABLE ${tableName} (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ${columns.map((col) => `${col} TEXT`).join(",\n")}
    )`;
    db.exec(createTableSql);

    // Insert rows
    const insertSql = `INSERT INTO ${tableName} (${columns.join(", ")}) VALUES (${columns.map(() => "?").join(", ")})`;
    const insertStmt = db.prepare(insertSql);
    
    const insertMany = db.transaction((items) => {
      for (const item of items) {
        insertStmt.run(columns.map((col) => item[col]?.toString() ?? null));
      }
    });

    insertMany(rows);
    console.log(`Inserted ${rows.length} rows into ${tableName}`);
  };

  // The custom specs expect table names like careops_patients_spec
  insertTable("careops_patients_spec", data.patients);
  insertTable("careops_medications_spec", data.medications);
  insertTable("careops_lab_reports_spec", data.labReports);
  insertTable("careops_doctor_chats_spec", data.doctorChats);
  insertTable("careops_pharmacy_receipts_spec", data.pharmacyReceipts);
  insertTable("careops_symptom_logs_spec", data.symptomLogs);
  insertTable("careops_appointments_spec", data.appointments);
  insertTable("careops_prescription_ocr_spec", data.prescriptionOcr);
  insertTable("careops_family_notes_spec", data.familyNotes);

  db.close();
  console.log("Database seeded successfully.");
}

main().catch(console.error);
