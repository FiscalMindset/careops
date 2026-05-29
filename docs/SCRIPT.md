# CareOps Agent Demo Script (Under 3 Minutes)

**0:00 – 0:20 | The Problem**
*(Visual: Screen showing scattered medical files, WhatsApp chats, PDFs, and a pharmacy receipt.)*
"When managing care for an aging parent, their health records are scattered everywhere. You have doctor instructions in WhatsApp, lab reports in PDFs, and symptom logs in a notes app. When you walk into a follow-up appointment, the doctor wastes the first ten minutes just trying to piece together a timeline."

**0:20 – 0:45 | What CareOps Does**
*(Visual: Transition to the clean CareOps Dashboard.)*
"CareOps Agent solves this. It's a Coral-powered first mate that turns scattered care records into a single, clean, doctor-ready packet. It automatically joins your prescriptions, symptoms, labs, and chat instructions."

**0:45 – 1:20 | Architecture & Coral**
*(Visual: CareOps Architecture Mermaid diagram showing the 9 data specs.)*
"Instead of writing complex custom merging logic, we use Coral as our central cross-source query layer. We defined 9 custom Coral specs representing these data silos. Our agent simply executes one massive `SELECT` and `LEFT JOIN` query across Coral to pull a unified patient timeline."

**1:20 – 2:25 | Live Demo: Doctor Visit Packet**
*(Visual: Screen recording of clicking "Generate Packet" for Patient pat-001.)*
"Let's prepare a packet for my father's diabetes follow-up. I click generate, and the agent instantly pulls the current medicines, recent HbA1c labs, and uncovers a dizziness symptom logged right after a medicine change. 
It also detects that we are missing this month's BP logs. 
It then formulates questions to ask the doctor. I can click 'Export' to get this as a printable Markdown document."

**2:25 – 2:50 | Safety Boundary**
*(Visual: Zoom in on the Safety Notice badge and the Coral SQL Evidence Panel.)*
"Crucially, CareOps is safe. It does not diagnose or prescribe. It strictly organizes data. And for full transparency, the Coral SQL Evidence panel shows exactly which queries and sources were used to back every piece of information."

**2:50 – 3:00 | Closing**
"CareOps Agent: turning scattered records into better care conversations. Built for Coral Hackathon Track 2."
