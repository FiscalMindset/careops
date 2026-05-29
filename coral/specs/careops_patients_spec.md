# careops_patients_spec

Maps synthetic or Synthea-like patient demographics.

| Column | Type | Description |
| --- | --- | --- |
| patient_id | string | Stable synthetic patient identifier |
| name | string | Synthetic patient display name |
| age | number | Age in years |
| gender | string | Synthetic gender value |
| condition_focus | string | Visit focus, such as diabetes follow-up |
| primary_doctor | string | Primary doctor for the care packet |

Status: custom local spec, not present in the current Coral MCP table list.
