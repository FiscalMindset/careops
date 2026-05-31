#!/usr/bin/env bash
set -euo pipefail

API_KEY="${GROQ_API_KEY:-$(grep GROQ_API_KEY ../.env.local 2>/dev/null | cut -d= -f2)}"
if [ -z "$API_KEY" ]; then
  echo "Error: GROQ_API_KEY not found. Set it or ensure ../.env.local has it."
  exit 1
fi

MODEL="canopylabs/orpheus-v1-english"
VOICE="hannah"
DIR="public/audio"
mkdir -p "$DIR"

generate() {
  local file="$1" text="$2"
  echo "Generating $file ..."
  curl -s -X POST "https://api.groq.com/openai/v1/audio/speech" \
    -H "Authorization: Bearer $API_KEY" \
    -H "Content-Type: application/json" \
    -d "$(cat <<END
{
  "model": "$MODEL",
  "input": $(echo "$text" | jq -Rs '.'),
  "voice": "$VOICE",
  "response_format": "wav"
}
END
)" \
    --output "$DIR/$file.wav" \
    -w "  HTTP %{http_code} %{size_download}B\n"
}

generate "scene-01" "CareOps Agent is a Coral-powered family care coordination assistant built by Vicky Kumar, also known as FiscalMindset, for Coral Hackathon Track Two."
generate "scene-02" "Family care records are scattered across chats, receipts, lab PDFs, prescriptions, symptom notes, and appointment cards. Before a doctor visit, there is no single source of truth."
generate "scene-03" "CareOps connects nine synthetic care sources through Coral SQL and generates a doctor-ready visit packet with medicines, labs, symptoms, instructions, refills, and missing records."
generate "scene-04" "The stack uses Next.js, TypeScript, Tailwind CSS, Coral MCP, Coral SQL, SQLite, and Vitest. Coral acts as the unified query layer across all care sources."
generate "scene-05" "This is the real app demo. I select a patient, ask a natural language question, run Coral, and generate a doctor-ready packet with SQL evidence."
generate "scene-06" "This is where Coral matters. The answer is not based on one file. It comes from joined records across medicines, labs, symptoms, doctor chats, receipts, appointments, and notes."
generate "scene-07" "CareOps is not a medical device. It does not diagnose, prescribe, or recommend medicine changes. It only organizes synthetic records for doctor-visit preparation."
generate "scene-08" "CareOps Agent is built on Coral by Vicky Kumar, FiscalMindset. The repository is github.com slash FiscalMindset slash careops. Thank you to Coral and WeMakeDevs."

echo "Done! Files in $DIR/"
ls -lh "$DIR/"
