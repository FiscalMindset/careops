"use client";

import { useState, useEffect } from "react";
import { Card, Badge, ModeBadge, ExportButton } from "@/components/ui";
import { FileText, Download, Trash2, Eye, EyeOff, RefreshCw, FileSearch, Loader2, ExternalLink, Clock, User, Stethoscope } from "lucide-react";

type ExportFile = {
  name: string;
  path: string;
  size: number;
  modifiedAt: string;
  content?: string;
};

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function renderMarkdown(md: string): string {
  let html = md
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/^### (.+)$/gm, '<h3 class="text-lg font-semibold text-ink mt-4 mb-2">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-xl font-semibold text-ink mt-5 mb-2">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="text-2xl font-semibold text-ink mt-6 mb-3">$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^- (.+)$/gm, '<li class="text-sm text-muted ml-4 list-disc">$1</li>')
    .replace(/^\d\. (.+)$/gm, '<li class="text-sm text-muted ml-4 list-decimal">$1</li>')
    .replace(/```(\w*)\n([\s\S]*?)```/g, '<pre class="bg-slate-950 text-slate-200 p-3 rounded-lg text-xs my-2 overflow-x-auto">$2</pre>')
    .replace(/`(.+?)`/g, '<code class="bg-slate-100 px-1 rounded text-xs">$1</code>')
    .replace(/\n\n/g, '</p><p class="text-sm leading-6 text-muted mb-3">')
    .replace(/\n/g, '<br/>');
  return `<p class="text-sm leading-6 text-muted mb-3">${html}</p>`;
}

export default function ExportsPage() {
  const [files, setFiles] = useState<ExportFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [preview, setPreview] = useState<string | null>(null);
  const [previewContent, setPreviewContent] = useState<string>("");
  const [error, setError] = useState("");

  const loadFiles = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/export?list=true");
      const data = await res.json();
      if (data.error) { setError(data.error); setFiles([]); }
      else { setFiles(data.files || []); setError(""); }
    } catch { setError("Failed to load exports"); setFiles([]); }
    setLoading(false);
  };

  useEffect(() => { loadFiles(); }, []);

  const openPreview = async (file: ExportFile) => {
    setPreview(file.name);
    setPreviewContent("Loading...");
    try {
      const res = await fetch(`/api/export?file=${encodeURIComponent(file.name)}`);
      const data = await res.json();
      setPreviewContent(data.content || "No content");
    } catch { setPreviewContent("Failed to load file content"); }
  };

  const deleteFile = async (name: string) => {
    try {
      await fetch(`/api/export?delete=${encodeURIComponent(name)}`, { method: "DELETE" });
      if (preview === name) { setPreview(null); setPreviewContent(""); }
      loadFiles();
    } catch { setError("Failed to delete file"); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-info">Exports</p>
          <h2 className="text-3xl font-semibold tracking-tight text-ink">Generated Packets</h2>
          <p className="mt-1 text-sm text-muted">Markdown doctor visit packets saved from the packet builder.</p>
        </div>
        <div className="flex items-center gap-3">
          <ModeBadge mode="coral_cli" />
          <button onClick={loadFiles} className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-2 text-xs font-medium text-muted hover:text-ink"><RefreshCw className="h-3.5 w-3.5" /> Refresh</button>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <ExportButton />
        <p className="text-xs text-muted">{files.length} file{files.length !== 1 ? "s" : ""} saved</p>
      </div>

      {error && <Card className="border-red-200 bg-red-50"><p className="text-sm text-danger">{error}</p></Card>}

      {loading ? (
        <Card><div className="flex items-center gap-3 py-8 justify-center"><Loader2 className="h-5 w-5 animate-spin text-info" /><p className="text-sm text-muted">Loading exports...</p></div></Card>
      ) : files.length === 0 ? (
        <Card><div className="py-8 text-center"><FileSearch className="h-10 w-10 text-muted mx-auto mb-3" /><p className="text-sm font-medium text-ink">No exports yet</p><p className="text-xs text-muted mt-1">Go to the Packet builder to generate a doctor visit packet.</p></div></Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {/* File list */}
          <div className="space-y-2">
            {files.map((file) => (
              <div key={file.name} className={`rounded-lg border p-4 cursor-pointer transition-colors ${preview === file.name ? "border-info bg-blue-50" : "border-border hover:bg-surface/50"}`} onClick={() => openPreview(file)}>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 min-w-0">
                    <FileText className={`h-5 w-5 shrink-0 mt-0.5 ${preview === file.name ? "text-info" : "text-muted"}`} />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-ink truncate">{file.name}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="flex items-center gap-1 text-xs text-muted"><Clock className="h-3 w-3" />{file.modifiedAt}</span>
                        <span className="text-xs text-muted">{formatBytes(file.size)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <a href={`/api/export?file=${encodeURIComponent(file.name)}&download=true`} className="rounded-md p-1.5 text-muted hover:text-ink hover:bg-slate-100" title="Download"><Download className="h-4 w-4" /></a>
                    <button onClick={(e) => { e.stopPropagation(); deleteFile(file.name); }} className="rounded-md p-1.5 text-muted hover:text-danger hover:bg-red-50" title="Delete"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Preview panel */}
          <div className="rounded-lg border border-border bg-white min-h-[400px]">
            {preview ? (
              <div>
                <div className="flex items-center justify-between border-b border-border px-4 py-3 bg-surface">
                  <div className="flex items-center gap-2"><Eye className="h-4 w-4 text-info" /><span className="text-sm font-medium text-ink">{preview}</span></div>
                  <a href={`/api/export?file=${encodeURIComponent(preview)}&download=true`} className="rounded-md p-1.5 text-muted hover:text-ink"><Download className="h-4 w-4" /></a>
                </div>
                <div className="p-4 overflow-x-auto prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: renderMarkdown(previewContent) }} />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full py-16">
                <EyeOff className="h-10 w-10 text-muted mb-3" />
                <p className="text-sm font-medium text-ink">Select a file to preview</p>
                <p className="text-xs text-muted mt-1">Click on any export file to preview its markdown content.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
