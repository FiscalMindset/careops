"use client";

import { useState, useEffect } from "react";
import { Card, Badge, ModeBadge } from "@/components/ui";
import {
  Pill, Stethoscope, Activity, Calendar, MessageSquare,
  FileText, User, TrendingUp, Loader2, Brain, Database, ClipboardList
} from "lucide-react";

type Patient = { patient_id: string; name: string; age: number; gender: string; condition_focus: string; primary_doctor: string };
type MedicineRow = { medicine_name: string; dose: string; frequency: string; start_date: string; end_date?: string };
type LabRow = { report_date: string; test_name: string; value: string; unit: string; reference_range: string };
type SymptomRow = { date: string; symptom: string; severity: number; notes: string; related_medicine: string };
type DoctorChatRow = { date: string; doctor: string; message: string; instruction_type: string };
type AppointmentRow = { appointment_date: string; doctor: string; speciality: string; reason: string; status: string };
type ReceiptRow = { date: string; medicine: string; quantity: string; amount: string; pharmacy: string };
type NoteRow = { date: string; note_author: string; note_text: string; priority: string };

type PatientAnalytics = {
  id: string;
  name: string;
  age: number;
  condition: string;
  doctor: string;
  medicineCount: number;
  labCount: number;
  symptomCount: number;
  chatCount: number;
  appointmentCount: number;
  receiptCount: number;
  noteCount: number;
  avgSeverity: number;
  activeMedicines: number;
  medicines: MedicineRow[];
  labs: LabRow[];
  symptoms: SymptomRow[];
  chats: DoctorChatRow[];
  appointments: AppointmentRow[];
  receipts: ReceiptRow[];
  notes: NoteRow[];
};

type FilterView = "overview" | "medicines" | "labs" | "symptoms" | "appointments" | "data";

function MiniBar({ value, max, color = "bg-info" }: { value: number; max: number; color?: string }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div className="h-2 w-full rounded-full bg-slate-100">
      <div className={`h-2 rounded-full ${color}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

function SeverityDot({ severity }: { severity: number }) {
  const colors = ["bg-green-400", "bg-green-500", "bg-yellow-500", "bg-orange-500", "bg-red-500"];
  return <span className={`inline-block h-2.5 w-2.5 rounded-full ${colors[Math.min(severity - 1, 4)]}`} />;
}

async function fetchRows(sql: string): Promise<any[]> {
  try {
    const resp = await fetch(`/api/coral/run-query?sql=${encodeURIComponent(sql)}`);
    const data = await resp.json();
    return data.rows || [];
  } catch {
    return [];
  }
}

async function loadPatientAnalytics(): Promise<PatientAnalytics[]> {
  const patientList: Patient[] = [];
  const patientsData = await fetchRows("SELECT patient_id, name, age, gender, condition_focus, primary_doctor FROM careops_patients.patients LIMIT 10");
  for (const r of patientsData) {
    patientList.push({
      patient_id: r.patient_id,
      name: r.name,
      age: Number(r.age),
      gender: r.gender,
      condition_focus: r.condition_focus,
      primary_doctor: r.primary_doctor,
    });
  }

  const results: PatientAnalytics[] = [];
  for (const pt of patientList) {
    try {
      const [medicines, labs, symptoms, chats, appointments, receipts, notes] = await Promise.all([
        fetchRows(`SELECT medicine_name, dose, frequency, start_date, end_date FROM careops_medications.medications WHERE patient_id = '${pt.patient_id}'`) as Promise<MedicineRow[]>,
        fetchRows(`SELECT report_date, test_name, value, unit, reference_range FROM careops_lab_reports.lab_reports WHERE patient_id = '${pt.patient_id}' ORDER BY report_date DESC`) as Promise<LabRow[]>,
        fetchRows(`SELECT date, symptom, severity, notes, related_medicine FROM careops_symptom_logs.symptom_logs WHERE patient_id = '${pt.patient_id}' ORDER BY date DESC`) as Promise<SymptomRow[]>,
        fetchRows(`SELECT date, doctor, message, instruction_type FROM careops_doctor_chats.doctor_chats WHERE patient_id = '${pt.patient_id}' ORDER BY date DESC`) as Promise<DoctorChatRow[]>,
        fetchRows(`SELECT appointment_date, doctor, speciality, reason, status FROM careops_appointments.appointments WHERE patient_id = '${pt.patient_id}' ORDER BY appointment_date DESC`) as Promise<AppointmentRow[]>,
        fetchRows(`SELECT date, medicine, quantity, amount, pharmacy FROM careops_pharmacy_receipts.pharmacy_receipts WHERE patient_id = '${pt.patient_id}' ORDER BY date DESC`) as Promise<ReceiptRow[]>,
        fetchRows(`SELECT date, note_author, note_text, priority FROM careops_family_notes.family_notes WHERE patient_id = '${pt.patient_id}' ORDER BY date DESC`) as Promise<NoteRow[]>,
      ]);

      const avgSeverity = symptoms.length ? Math.round(symptoms.reduce((s, x) => s + x.severity, 0) / symptoms.length * 10) / 10 : 0;

      results.push({
        id: pt.patient_id, name: pt.name, age: pt.age, condition: pt.condition_focus, doctor: pt.primary_doctor,
        medicineCount: medicines.length, labCount: labs.length, symptomCount: symptoms.length,
        chatCount: chats.length, appointmentCount: appointments.length, receiptCount: receipts.length,
        noteCount: notes.length, avgSeverity, activeMedicines: medicines.filter(m => !m.end_date || m.end_date === "").length,
        medicines, labs, symptoms, chats, appointments, receipts, notes,
      });
    } catch {}
  }
  return results;
}

function DataTable({ rows, label }: { rows: any[]; label: string }) {
  if (!rows.length) return <p className="text-sm text-muted py-4">No {label} records found.</p>;
  const cols = Object.keys(rows[0]);
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="bg-surface border-b border-border">
            {cols.map((c) => <th key={c} className="px-3 py-2 text-left font-medium text-muted capitalize whitespace-nowrap">{c.replace(/_/g, " ")}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-border/50 hover:bg-surface/50">
              {cols.map((c) => <td key={c} className="px-3 py-2 text-ink whitespace-nowrap">{String(row[c] ?? "")}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function AnalyticsPage() {
  const [patients, setPatients] = useState<PatientAnalytics[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [loading, setLoading] = useState(true);
  const [filterView, setFilterView] = useState<FilterView>("overview");
  const [ollamaModels, setOllamaModels] = useState<any[]>([]);

  useEffect(() => {
    loadPatientAnalytics().then((pts) => {
      setPatients(pts);
      if (pts.length > 0) setSelectedId(pts[0].id);
      setLoading(false);
    });
    fetchRows("SELECT name, size, family, parameter_size FROM ollama.models LIMIT 10").then((rows) => {
      setOllamaModels(rows);
    }).catch(() => {});
  }, []);

  const pt = patients.find((p) => p.id === selectedId);

  const totalRecords = patients.reduce((s, p) => s + p.medicineCount + p.labCount + p.symptomCount + p.chatCount + p.appointmentCount + p.receiptCount + p.noteCount, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-info">Analytics</p>
          <h2 className="text-3xl font-semibold tracking-tight text-ink">Care Operations Analytics</h2>
          <p className="mt-1 text-sm text-muted">Per-patient analysis with Coral SQL across 9 connected sources.</p>
        </div>
        <ModeBadge mode="coral_cli" />
      </div>

      {loading ? (
        <Card><div className="flex items-center gap-3 py-8 justify-center"><Loader2 className="h-6 w-6 animate-spin text-info" /><p className="text-sm text-muted">Loading patient analytics from Coral SQL...</p></div></Card>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-6">
            <Card><p className="text-xs text-muted">Patients</p><p className="mt-1 text-2xl font-semibold">{patients.length}</p></Card>
            <Card><p className="text-xs text-muted">Total Records</p><p className="mt-1 text-2xl font-semibold">{totalRecords}</p></Card>
            <Card><p className="text-xs text-muted">Coral Sources</p><p className="mt-1 text-2xl font-semibold">9</p></Card>
            <Card><p className="text-xs text-muted">Coral Engine</p><p className="mt-1"><Badge tone="success">coral sql</Badge></p></Card>
            <Card><p className="text-xs text-muted">Ollama Models</p><p className="mt-1 text-2xl font-semibold">{ollamaModels.length}</p></Card>
            <Card><p className="text-xs text-muted">AI Ready</p><p className="mt-1"><Badge tone={ollamaModels.length > 0 ? "success" : "neutral"}>{ollamaModels.length > 0 ? "Online" : "Offline"}</Badge></p></Card>
          </div>

          <Card>
            <div className="flex items-center gap-4">
              <User className="h-5 w-5 text-info shrink-0" />
              <select
                value={selectedId}
                onChange={(e) => setSelectedId(e.target.value)}
                className="flex-1 rounded-lg border border-border bg-white px-4 py-2.5 text-sm text-ink focus:border-info focus:outline-none focus:ring-1 focus:ring-info"
              >
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>{p.name} ({p.id}) — {p.condition}</option>
                ))}
              </select>
              <div className="flex gap-1 flex-wrap">
                {(["overview", "medicines", "labs", "symptoms", "appointments", "data"] as FilterView[]).map((v) => (
                  <button key={v} onClick={() => setFilterView(v)}
                    className={`rounded-md px-3 py-2 text-xs font-medium capitalize ${filterView === v ? "bg-info text-white" : "bg-surface text-muted hover:text-ink"}`}
                  >{v}</button>
                ))}
              </div>
            </div>
          </Card>

          {pt && (
            <>
              {filterView !== "data" && (
                <>
                  <div className="grid gap-4 md:grid-cols-4">
                    <Card><div className="flex items-center gap-2"><Pill className="h-4 w-4 text-info" /><span className="text-sm font-medium">Medicines</span></div><p className="mt-1 text-2xl font-semibold">{pt.medicineCount}</p><p className="text-xs text-muted">{pt.activeMedicines} active</p></Card>
                    <Card><div className="flex items-center gap-2"><Stethoscope className="h-4 w-4 text-info" /><span className="text-sm font-medium">Labs</span></div><p className="mt-1 text-2xl font-semibold">{pt.labCount}</p><p className="text-xs text-muted">{pt.labs.length > 0 ? pt.labs[0].report_date : "N/A"} latest</p></Card>
                    <Card><div className="flex items-center gap-2"><Activity className="h-4 w-4 text-info" /><span className="text-sm font-medium">Symptoms</span></div><p className="mt-1 text-2xl font-semibold">{pt.symptomCount}</p><p className="text-xs text-muted">Avg severity: {pt.avgSeverity}/5</p></Card>
                    <Card><div className="flex items-center gap-2"><Calendar className="h-4 w-4 text-info" /><span className="text-sm font-medium">Appointments</span></div><p className="mt-1 text-2xl font-semibold">{pt.appointmentCount}</p><p className="text-xs text-muted">{pt.appointments.filter(a => a.status === "scheduled").length} upcoming</p></Card>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <Card><div className="flex items-center gap-2"><MessageSquare className="h-4 w-4 text-info" /><span className="text-sm font-medium">Doctor Chats</span></div><p className="mt-1 text-2xl font-semibold">{pt.chatCount}</p><p className="text-xs text-muted">{pt.chats.filter(c => c.instruction_type === "medicine_change").length} medicine changes</p></Card>
                    <Card><div className="flex items-center gap-2"><FileText className="h-4 w-4 text-info" /><span className="text-sm font-medium">Records</span></div><p className="mt-1 text-2xl font-semibold">{pt.receiptCount + pt.noteCount}</p><p className="text-xs text-muted">{pt.receiptCount} receipts · {pt.noteCount} family notes</p></Card>
                  </div>
                </>
              )}

              {filterView === "data" && (
                <div className="space-y-4">
                  <Card>
                    <h3 className="font-semibold text-ink flex items-center gap-2 mb-3"><Database className="h-4 w-4 text-info" /> All Raw Data for {pt.name}</h3>
                    <p className="text-xs text-muted mb-4">Every record across all 9 Coral sources for this patient.</p>
                  </Card>
                  {[
                    { label: "Medications", icon: Pill, rows: pt.medicines },
                    { label: "Lab Reports", icon: Stethoscope, rows: pt.labs },
                    { label: "Symptoms", icon: Activity, rows: pt.symptoms },
                    { label: "Doctor Chats", icon: MessageSquare, rows: pt.chats },
                    { label: "Appointments", icon: Calendar, rows: pt.appointments },
                    { label: "Pharmacy Receipts", icon: ClipboardList, rows: pt.receipts },
                    { label: "Family Notes", icon: FileText, rows: pt.notes },
                  ].map((section) => (
                    <Card key={section.label}>
                      <h4 className="font-semibold text-ink flex items-center gap-2 mb-3">
                        <section.icon className="h-4 w-4 text-info" />
                        {section.label}
                        <Badge tone="neutral">{section.rows.length} records</Badge>
                      </h4>
                      <DataTable rows={section.rows} label={section.label} />
                    </Card>
                  ))}
                </div>
              )}

              {pt.medicines.length > 0 && filterView === "medicines" && (
                <Card>
                  <h3 className="font-semibold text-ink flex items-center gap-2 mb-3"><Pill className="h-4 w-4 text-info" /> Medicines</h3>
                  <div className="grid gap-3 md:grid-cols-2">
                    {pt.medicines.map((m, i) => (
                      <div key={i} className="rounded-lg border border-border p-3">
                        <div className="flex items-start justify-between">
                          <div><p className="text-sm font-medium text-ink">{m.medicine_name}</p><p className="text-xs text-muted">{m.dose} · {m.frequency}</p></div>
                          <Badge tone={m.end_date && m.end_date !== "" ? "neutral" : "success"}>{m.end_date && m.end_date !== "" ? "Discontinued" : "Active"}</Badge>
                        </div>
                        <p className="mt-1 text-xs text-muted">Started: {m.start_date}</p>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {pt.labs.length > 0 && filterView === "labs" && (
                <Card>
                  <h3 className="font-semibold text-ink flex items-center gap-2 mb-3"><Stethoscope className="h-4 w-4 text-info" /> Lab Results</h3>
                  <div className="space-y-3">
                    {pt.labs.map((l, i) => (
                      <div key={i} className="flex items-center gap-4 rounded-lg border border-border p-3">
                        <div className="flex-1"><p className="text-sm font-medium text-ink">{l.test_name}</p><p className="text-xs text-muted">{l.report_date}</p></div>
                        <div className="text-right"><p className="text-sm font-semibold">{l.value} <span className="text-xs text-muted">{l.unit}</span></p><p className="text-xs text-muted">Ref: {l.reference_range}</p></div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {pt.symptoms.length > 0 && filterView === "symptoms" && (
                <Card>
                  <h3 className="font-semibold text-ink flex items-center gap-2 mb-3"><Activity className="h-4 w-4 text-info" /> Symptom Timeline</h3>
                  <div className="space-y-2">
                    {pt.symptoms.map((s, i) => (
                      <div key={i} className="flex items-center gap-3 rounded-lg border border-border p-3">
                        <SeverityDot severity={s.severity} />
                        <div className="flex-1"><p className="text-sm font-medium text-ink">{s.symptom}</p><p className="text-xs text-muted">{s.date}</p></div>
                        <Badge tone={s.severity >= 4 ? "danger" : s.severity >= 3 ? "warning" : "info"}>Severity {s.severity}</Badge>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {pt.appointments.length > 0 && filterView === "appointments" && (
                <Card>
                  <h3 className="font-semibold text-ink flex items-center gap-2 mb-3"><Calendar className="h-4 w-4 text-info" /> Appointments</h3>
                  <div className="space-y-2">
                    {pt.appointments.map((a, i) => (
                      <div key={i} className="flex items-center gap-4 rounded-lg border border-border p-3">
                        <div className="flex-1"><p className="text-sm font-medium text-ink">{a.reason}</p><p className="text-xs text-muted">{a.doctor} · {a.speciality}</p></div>
                        <div className="text-right"><p className="text-sm">{a.appointment_date}</p><Badge tone={a.status === "scheduled" ? "success" : "neutral"}>{a.status}</Badge></div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {filterView === "overview" && (
                <>
                  {/* Cross-patient comparison */}
                  <Card>
                    <h3 className="font-semibold text-ink flex items-center gap-2 mb-3"><TrendingUp className="h-4 w-4 text-info" /> Patient Comparison</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead><tr className="bg-surface border-b border-border">
                          <th className="px-3 py-2 text-left font-medium text-muted">Patient</th>
                          <th className="px-3 py-2 text-left font-medium text-muted">Condition</th>
                          <th className="px-3 py-2 text-right font-medium text-muted">Medicines</th>
                          <th className="px-3 py-2 text-right font-medium text-muted">Labs</th>
                          <th className="px-3 py-2 text-right font-medium text-muted">Symptoms</th>
                          <th className="px-3 py-2 text-right font-medium text-muted">Avg Severity</th>
                          <th className="px-3 py-2 text-right font-medium text-muted">Appointments</th>
                          <th className="px-3 py-2 text-right font-medium text-muted">Chats</th>
                          <th className="px-3 py-2 text-right font-medium text-muted">Receipts</th>
                        </tr></thead>
                        <tbody>
                          {patients.map((p) => {
                            const maxMed = Math.max(...patients.map(x => x.medicineCount), 1);
                            return (
                              <tr key={p.id} className={`border-b border-border/50 hover:bg-surface/50 cursor-pointer ${p.id === selectedId ? "bg-blue-50" : ""}`} onClick={() => setSelectedId(p.id)}>
                                <td className="px-3 py-2 font-medium text-ink">{p.name}</td>
                                <td className="px-3 py-2 text-muted">{p.condition}</td>
                                <td className="px-3 py-2 text-right"><MiniBar value={p.medicineCount} max={maxMed} color="bg-blue-500" /><span className="text-xs">{p.medicineCount}</span></td>
                                <td className="px-3 py-2 text-right">{p.labCount}</td>
                                <td className="px-3 py-2 text-right">{p.symptomCount}</td>
                                <td className="px-3 py-2 text-right">{p.avgSeverity}</td>
                                <td className="px-3 py-2 text-right">{p.appointmentCount}</td>
                                <td className="px-3 py-2 text-right">{p.chatCount}</td>
                                <td className="px-3 py-2 text-right">{p.receiptCount}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </Card>

                  {/* Data Source Breakdown */}
                  <Card>
                    <h3 className="font-semibold text-ink flex items-center gap-2 mb-3"><Database className="h-4 w-4 text-info" /> Data Source Breakdown</h3>
                    <div className="grid gap-3 md:grid-cols-3">
                      {[
                        { label: "Medical", sources: ["careops_patients", "careops_medications", "careops_lab_reports", "careops_prescription_ocr"], count: pt.medicineCount + pt.labCount },
                        { label: "Communications", sources: ["careops_doctor_chats", "careops_family_notes"], count: pt.chatCount + pt.noteCount },
                        { label: "Operations", sources: ["careops_pharmacy_receipts", "careops_appointments", "careops_symptom_logs"], count: pt.receiptCount + pt.appointmentCount + pt.symptomCount },
                      ].map((g) => (
                        <div key={g.label} className="rounded-lg border border-border p-3">
                          <p className="text-sm font-medium text-ink">{g.label}</p>
                          <p className="mt-1 text-2xl font-semibold">{g.count}</p>
                          <p className="text-xs text-muted">{g.sources.join(", ")}</p>
                        </div>
                      ))}
                    </div>
                  </Card>
                </>
              )}

              {/* Ollama Models Card */}
              {ollamaModels.length > 0 && (
                <Card className="border-purple-200">
                  <div className="flex items-center gap-2 mb-3">
                    <Brain className="h-5 w-5 text-purple-500" />
                    <h3 className="font-semibold text-ink">Ollama AI Models</h3>
                    <Badge tone="success">Connected via Coral</Badge>
                  </div>
                  <p className="text-xs text-muted mb-3">Queryable through Coral SQL ollama.* tables. {ollamaModels.length} local models available.</p>
                  <div className="grid gap-2 md:grid-cols-3">
                    {ollamaModels.map((m, i) => (
                      <div key={i} className="rounded-lg border border-purple-100 bg-purple-50 p-3">
                        <p className="text-sm font-medium text-ink">{m.name}</p>
                        <p className="text-xs text-muted">{m.family} · {m.parameter_size} · {(m.size / 1e9).toFixed(1)}GB</p>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
