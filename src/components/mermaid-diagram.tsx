"use client";

import { useEffect, useRef, useState, useId } from "react";

interface MermaidDiagramProps {
  chart: string;
  title?: string;
}

export function MermaidDiagram({ chart, title }: MermaidDiagramProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState<string | null>(null);
  const id = useId();

  useEffect(() => {
    let mounted = true;

    async function render() {
      try {
        const mermaid = (await import("mermaid")).default;
        mermaid.initialize({
          startOnLoad: false,
          theme: "default",
          themeVariables: {
            primaryColor: "#eff6ff",
            primaryBorderColor: "#2563eb",
            primaryTextColor: "#0f172a",
            lineColor: "#94a3b8",
            secondaryColor: "#f8fafc",
            tertiaryColor: "#ffffff",
          },
        });

        if (!ref.current) return;
        const diagramId = `mermaid-${id.replace(/[^a-zA-Z0-9]/g, "-")}`;
        const { svg } = await mermaid.render(diagramId, chart);

        if (mounted && ref.current) {
          ref.current.innerHTML = svg;
          setState("ready");
        }
      } catch (e) {
        if (mounted) {
          setError(e instanceof Error ? e.message : "Render failed");
          setState("error");
        }
      }
    }

    render();
    return () => { mounted = false; };
  }, [chart, id]);

  return (
    <div>
      {title && <h4 className="mb-3 font-semibold text-ink">{title}</h4>}
      {state === "loading" && (
        <div className="flex items-center justify-center rounded-lg border border-border bg-slate-50 p-12">
          <span className="text-sm text-muted">Loading diagram...</span>
        </div>
      )}
      {state === "error" && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-xs text-red-600 font-mono whitespace-pre-wrap">{error}</p>
        </div>
      )}
      <div ref={ref} className={state !== "ready" ? "hidden" : "flex justify-center"} />
    </div>
  );
}
