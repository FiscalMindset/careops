"use client";

import { useState } from "react";
import { QueryInput } from "./query-input";
import { User } from "lucide-react";

type Patient = {
  patient_id: string;
  name: string;
  age: number;
  gender: string;
  condition_focus: string;
  primary_doctor: string;
};

export function PatientSelector({ patients }: { patients: Patient[] }) {
  const [selectedId, setSelectedId] = useState("pat-001");

  const selected = patients.find((p) => p.patient_id === selectedId);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <User className="h-5 w-5 text-info shrink-0" />
        <select
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
          className="flex-1 rounded-lg border border-border bg-white px-4 py-2.5 text-sm text-ink focus:border-info focus:outline-none focus:ring-1 focus:ring-info"
        >
          {patients.map((p) => (
            <option key={p.patient_id} value={p.patient_id}>
              {p.name} — {p.condition_focus}
            </option>
          ))}
        </select>
        {selected && (
          <span className="text-xs text-muted hidden sm:block">
            {selected.age}y · {selected.gender} · {selected.primary_doctor}
          </span>
        )}
      </div>
      <QueryInput patientId={selectedId} showPatientInput={false} />
    </div>
  );
}
