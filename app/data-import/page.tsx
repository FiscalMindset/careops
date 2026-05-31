import type { Metadata } from "next";

export const dynamic = "force-dynamic";
import { getSourceRecordCounts, getAllSourceManifests } from "@/lib/data/data-importer";
import DataImportClient from "./data-import-client";

export const metadata: Metadata = {
  title: "Import Data — CareOps Agent",
};

export default async function DataImportPage() {
  const manifests = getAllSourceManifests();
  const counts = await getSourceRecordCounts();

  const entries = manifests.map((m) => ({
    key: m.key,
    label: m.label,
    specName: m.specName,
    table: m.table,
    columns: m.columns.map((c) => c.name),
    rowCount: counts[m.key] || 0,
  }));

  return <DataImportClient entries={entries} />;
}
