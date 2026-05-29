import { CoralClient } from "@/lib/coral/client";
import { TIMELINE_QUERY } from "@/lib/coral/queries";
import { PageHeader, TimelineEventCard } from "@/components/ui";

export default async function TimelinePage() {
  const patientId = "pat-001";
  
  // Use the Coral abstraction layer to query the unified timeline
  const coral = new CoralClient();
  let events = [];
  try {
    const result = await coral.executeQuery(TIMELINE_QUERY, [patientId, patientId, patientId, patientId, patientId]);
    
    // Map Coral SQL rows to TimelineEvent format
    events = result.rows.map((row, i) => {
      // Columns: type, date, description, extra
      return {
        id: `event-${i}`,
        type: row[0],
        date: row[1],
        title: row[2],
        detail: row[3],
        confidence: "high", // Mocked confidence for demo
        source: `careops_${row[0]}s_spec` // Mocked source name based on type
      };
    });
  } catch (err) {
    console.error("Failed to load timeline", err);
  }

  return (
    <div>
      <PageHeader 
        title="Care Timeline" 
        eyebrow="Cross-source chronology"
      >
        A Coral-style joined timeline across prescriptions, chats, symptoms, labs, and refills.
      </PageHeader>
      <div className="max-w-4xl mt-6">
        {events.length > 0 ? (
          events.map((event) => <TimelineEventCard key={event.id} event={event} />)
        ) : (
          <p className="text-muted">No timeline events found or mock database not initialized. Did you run `npm run seed`?</p>
        )}
      </div>
    </div>
  );
}
