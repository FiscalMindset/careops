# CareOps Architecture

This document outlines the system architecture and data flow for the CareOps Agent. 

## System Architecture

The application is built on Next.js but relies fundamentally on the **Coral MCP (Model Context Protocol)** as a data abstraction layer. Coral handles the cross-source joins, while the CareOps Agent focuses purely on the business logic of summarizing those joined rows and applying safety constraints.

```mermaid
flowchart TD
    User["User: Family caregiver"] --> UI["CareOps Web App (Next.js)"]
    UI --> Agent["CareOps Agent"]
    Agent --> Coral["Coral MCP / SQL Layer"]

    Coral --> Patients["careops_patients_spec"]
    Coral --> Meds["careops_medications_spec"]
    Coral --> Labs["careops_lab_reports_spec"]
    Coral --> Chats["careops_doctor_chats_spec"]
    Coral --> Pharmacy["careops_pharmacy_receipts_spec"]
    Coral --> Symptoms["careops_symptom_logs_spec"]
    Coral --> Appointments["careops_appointments_spec"]
    Coral --> OCR["careops_prescription_ocr_spec"]

    Agent --> Packet["Doctor Visit Packet"]
    Packet --> Timeline["Care Timeline"]
    Packet --> Questions["Questions for Doctor"]
    Packet --> Missing["Missing Records"]
    Packet --> Export["Markdown/PDF Export"]
```

## Data and Request Flow

When a user requests a Doctor Visit Packet, the system follows this sequence:

```mermaid
sequenceDiagram
    participant U as User
    participant UI as CareOps UI
    participant A as CareOps Agent
    participant C as Coral SQL Layer
    participant S as Source Specs

    U->>UI: Select patient + visit purpose
    UI->>A: Generate care packet
    A->>C: Run cross-source SQL queries
    C->>S: Query care source specs
    S-->>C: Joined care evidence
    C-->>A: Results
    A-->>UI: Timeline + packet + questions
    UI-->>U: Doctor-ready packet
```

## The Role of Coral
Coral acts as the universal translator. Without Coral, CareOps would need 9 different API client libraries to fetch from the lab portal, the pharmacy portal, WhatsApp exports, etc., and then write complex `map-reduce` logic in Node.js to correlate them by date. 

With Coral, CareOps simply executes `LEFT JOIN` SQL queries, leaving the heavy lifting of data unification to the MCP.
