import { Card, PageHeader, SafetyNotice } from "@/components/ui";

export default function AboutPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="About CareOps" eyebrow="Hackathon Track 2">CareOps Agent is a Coral-powered personal agent for family care coordination.</PageHeader>
      <SafetyNotice />
      <Card>
        <h3 className="font-semibold">About Me</h3>
        <p className="mt-2 text-sm leading-6 text-muted">GitHub: FiscalMindset</p>
        <p className="mt-1 text-sm leading-6 text-muted">Open-source builder exploring Coral-powered personal agents.</p>
        <p className="mt-1 text-sm leading-6 text-muted">I build practical AI systems, source specs, and agent workflows that turn scattered data into useful products.</p>
      </Card>
    </div>
  );
}
