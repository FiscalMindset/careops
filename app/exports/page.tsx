import fs from "node:fs/promises";
import path from "node:path";
import { Card, ExportButton, PageHeader } from "@/components/ui";

export default async function ExportsPage() {
  const exportDir = path.join(process.cwd(), "exports");
  const files = await fs.readdir(exportDir).catch(() => []);
  const markdownFiles = files.filter((file) => file.endsWith(".md"));
  return (
    <div className="space-y-6">
      <PageHeader title="Exports" eyebrow="Markdown packets">Generated doctor visit packets are saved under /exports.</PageHeader>
      <ExportButton />
      <div className="grid gap-4">
        {markdownFiles.length ? markdownFiles.map((file) => <Card key={file}><p className="font-medium">{file}</p><p className="text-sm text-muted">Saved in /exports</p></Card>) : <Card><p className="text-sm text-muted">No exports yet. Generate one from the packet builder.</p></Card>}
      </div>
    </div>
  );
}
