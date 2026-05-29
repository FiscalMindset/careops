"use client";

import { useState, useEffect } from "react";
import { Card, Badge, ModeBadge } from "@/components/ui";
import {
  BarChart3, Pill, Stethoscope, Activity, Calendar, MessageSquare,
  FileText, AlertCircle, User, TrendingUp, Filter, Download,
  ChevronDown, Search, RefreshCw, Loader2, Brain
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

type FilterView = "overview" | "medicines" | "labs" | "symptoms" | "appointments";

const ENV_MODE = typeof process !== "undefined" && process.env.NEXT_PUBLIC_QUERY_MODE === "mock" ? "mock" : "coral_cli";

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

async function loadPatientAnalytics(): Promise<PatientAnalytics[]> {
  const data = await fetch("/api/query?q=analytics&patientId=pat-001").then((r) => r.json());
  const patients: Patient[] = data.datasetStats?.patients ? [] : [];

  const patientList: Patient[] = [];
  try {
    const patientsResp = await fetch("/api/coral/run-query?sql=" + encodeURIComponent("SELECT patient_id, name, age, gender, condition_focus, primary_doctor FROM careops_patients.patients LIMIT 10"));
    const patientsData = await patientsResp.json();
    if (patientsData.rows) patientList.push(...patientsData.rows.map((r: any) => ({
      patient_id: r[0], name: r[1], age: Number(r[2]), gender: r[3], condition_focus: r[4], primary_doctor: r[5]
    })));
  } catch {}

  const results: PatientAnalytics[] = [];
  for (const pt of patientList) {
    try {
      const [medResp, labResp, symResp, chatResp, aptResp, recResp, noteResp] = await Promise.all([
        fetch(`/api/coral/run-query?sql=${encodeURIComponent(`SELECT medicine_name, dose, frequency, start_date, end_date FROM careops_medications.medications WHERE patient_id = '${pt.patient_id}'`)}`).then(r => r.json()),
        fetch(`/api/coral/run-query?sql=${encodeURIComponent(`SELECT report_date, test_name, value, unit, reference_range FROM careops_lab_reports.lab_reports WHERE patient_id = '${pt.patient_id}' ORDER BY report_date DESC`)}`).then(r => r.json()),
        fetch(`/api/coral/run-query?sql=${encodeURIComponent(`SELECT date, symptom, severity, notes, related_medicine FROM careops_symptom_logs.symptom_logs WHERE patient_id = '${pt.patient_id}' ORDER BY date DESC`)}`).then(r => r.json()),
        fetch(`/api/coral/run-query?sql=${encodeURIComponent(`SELECT date, doctor, message, instruction_type FROM careops_doctor_chats.doctor_chats WHERE patient_id = '${pt.patient_id}' ORDER BY date DESC`)}`).then(r => r.json()),
        fetch(`/api/coral/run-query?sql=${encodeURIComponent(`SELECT appointment_date, doctor, speciality, reason, status FROM careops_appointments.appointments WHERE patient_id = '${pt.patient_id}' ORDER BY appointment_date DESC`)}`).then(r => r.json()),
        fetch(`/api/coral/run-query?sql=${encodeURIComponent(`SELECT date, medicine, quantity, amount, pharmacy FROM careops_pharmacy_receipts.pharmacy_receipts WHERE patient_id = '${pt.patient_id}' ORDER BY date DESC`)}`).then(r => r.json()),
        fetch(`/api/coral/run-query?sql=${encodeURIComponent(`SELECT date, note_author, note_text, priority FROM careops_family_notes.family_notes WHERE patient_id = '${pt.patient_id}' ORDER BY date DESC`)}`).then(r => r.json()),
      ]);

      const toRows = (resp: any) => resp.rows ? resp.rows.map((r: any[]) => {
        const obj: any = {};
        (resp.columns || []).forEach((c: string, i: number) => obj[c] = r[i]);
        return obj;
      }) : [];

      const medicines: MedicineRow[] = toRows(medResp);
      const labs: LabRow[] = toRows(labResp);
      const symptoms: SymptomRow[] = toRows(symResp);
      const chats: DoctorChatRow[] = toRows(chatResp);
      const appointments: AppointmentRow[] = toRows(aptResp);
      const receipts: ReceiptRow[] = toRows(recResp);
      const notes: NoteRow[] = toRows(noteResp);

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
    fetch("/api/coral/run-query?sql=" + encodeURIComponent("SELECT name, size, family, parameter_size FROM ollama.models LIMIT 10"))
      .then(r => r.json()).then(d => d.rows ? setOllamaModels(d.rows.map((r: any[]) => ({
        name: r[0], size: r[1], family: r[2], params: r[3]
      }))) : []).catch(() => {});
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
        <ModeBadge mode={ENV_MODE} />
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
              <User className="h-5 w-5 text-info" />
              <select
                value={selectedId}
                onChange={(e) => setSelectedId(e.target.value)}
                className="flex-1 rounded-lg border border-border bg-white px-4 py-2.5 text-sm text-ink focus:border-info focus:outline-none focus:ring-1 focus:ring-info"
              >
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>{p.name} ({p.id}) — {p.condition}</option>
                ))}
              </select>
              <div className="flex gap-1">
                {(["overview", "medicines", "labs", "symptoms", "appointments"] as FilterView[]).map((v) => (
                  <button key={v} onClick={() => setFilterView(v)}
                    className={`rounded-md px-3 py-2 text-xs font-medium capitalize ${filterView === v ? "bg-info text-white" : "bg-surface text-muted hover:text-ink"}`}
                  >{v}</button>
                ))}
              </div>
            </div>
          </Card>

          {pt && (
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

              {/* Patient detail cards based on filter */}
              {pt.medicines.length > 0 && (filterView === "overview" || filterView === "medicines") && (
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

              {pt.labs.length > 0 && (filterView === "overview" || filterView === "labs") && (
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

              {pt.symptoms.length > 0 && (filterView === "overview" || filterView === "symptoms") && (
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

              {pt.appointments.length > 0 && (filterView === "overview" || filterView === "appointments") && (
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

              {/* Cross-patient comparison */}
              {filterView === "overview" && (
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
                        <p className="text-xs text-muted">{m.family} · {m.params} · {(m.size / 1e9).toFixed(1)}GB</p>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </>
          )}

          {/* Cross-source analysis */}
          {pt && (
            <Card>
              <h3 className="font-semibold text-ink flex items-center gap-2 mb-3"><FileText className="h-4 w-4 text-info" /> Data Source Breakdown</h3>
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
          )}
        </>
      )}
    </div>
  );
}
