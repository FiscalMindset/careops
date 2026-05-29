import type { Metadata } from "next";
import { ClipboardList, Database, FileText, Home, Info, Layers, UserRound, CalendarClock } from "lucide-react";
import "./globals.css";

export const metadata: Metadata = {
  title: "CareOps Agent",
  description: "A Coral-powered family care coordination first mate"
};

const nav = [
  { href: "/", label: "Dashboard", icon: Home },
  { href: "/data-sources", label: "Data Sources", icon: Database },
  { href: "/patients", label: "Patient", icon: UserRound },
  { href: "/timeline", label: "Timeline", icon: CalendarClock },
  { href: "/packet", label: "Packet", icon: ClipboardList },
  { href: "/evidence", label: "Evidence", icon: Layers },
  { href: "/exports", label: "Exports", icon: FileText },
  { href: "/about", label: "About", icon: Info }
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen font-sans antialiased">
        <div className="flex min-h-screen bg-white">
          <aside className="hidden w-72 border-r border-border bg-surface/70 px-5 py-6 lg:block">
            <div className="mb-8">
              <p className="text-sm font-semibold uppercase tracking-wide text-info">Coral Track 2</p>
              <h1 className="mt-2 text-2xl font-semibold text-ink">CareOps Agent</h1>
              <p className="mt-2 text-sm text-muted">Family care coordination first mate.</p>
            </div>
            <nav className="space-y-1">
              {nav.map((item) => {
                const Icon = item.icon;
                return (
                  <a key={item.href} href={item.href} className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-ink hover:bg-white hover:shadow-panel">
                    <Icon className="h-4 w-4 text-muted" />
                    {item.label}
                  </a>
                );
              })}
            </nav>
          </aside>
          <div className="flex min-w-0 flex-1 flex-col">
            <header className="border-b border-border bg-white px-4 py-3 lg:hidden">
              <div className="flex items-center justify-between">
                <strong>CareOps Agent</strong>
                <a className="text-sm text-info" href="/packet">Generate</a>
              </div>
            </header>
            <main className="flex-1 px-4 py-6 sm:px-6 lg:px-10">{children}</main>
          </div>
        </div>
      </body>
    </html>
  );
}
