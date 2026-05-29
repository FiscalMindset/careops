# PR: Project Setup and Design System

## Summary
Initial project setup for CareOps Agent. This establishes the foundation of the Next.js application, including the design system, layout, and environment configuration. 

## Files Changed
- `.env.local`: Created safe placeholder values based on `.env.example`.
- `app/globals.css`: Ensured clean aesthetic with white background and black text.
- `app/layout.tsx`: Configured base layout with navigation sidebar and professional healthcare aesthetic.
- `tailwind.config.ts`: Added semantic colors for statuses (info, success, warning, danger).

## Tests Run
- N/A for CSS/Layout setup, but verified the Next.js development server runs properly.

## Screenshots
*N/A - Base project scaffold.*

## Coral Relevance
This foundation sets up the environment variables (`NEXT_PUBLIC_USE_MOCK_CORAL`, `CORAL_MCP_SERVER_URL`) needed to seamlessly switch between the mock Coral SQLite database and the real Coral MCP integration in later PRs.

## Safety Notes
Ensured that `.env.local` contains no real secrets or patient data, adhering to the project's safety boundaries.
