import { loadCareOpsData } from "@/lib/data/load-careops-data";
import { PageHeader, SourceStatusCard } from "@/components/ui";

export default async function DataSourcesPage() {
  const data = await loadCareOpsData();
  const sources = [
    ["Synthea-like synthetic patient records", data.patients.length],
    ["Doctor chat instructions", data.doctorChats.length],
    ["Prescription OCR records", data.prescriptionOcr.length],
    ["Lab report records", data.labReports.length],
    ["Pharmacy receipt records", data.pharmacyReceipts.length],
    ["Symptom logs", data.symptomLogs.length],
    ["Appointment calendar", data.appointments.length],
    ["Family notes", data.familyNotes.length],
    ["Medication records", data.medications.length]
  ] as const;

  return (
    <div>
      <PageHeader title="Data Sources" eyebrow="Simulated Coral sources">All rows are synthetic and local-first for a safe hackathon demo.</PageHeader>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {sources.map(([name, rows]) => <SourceStatusCard key={name} name={name} rows={rows} status="simulated" />)}
      </div>
    </div>
  );
}
