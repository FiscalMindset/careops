import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { BarChart3, ClipboardList, Database, FileText, Home, Info, Layers, Upload, UserRound, CalendarClock, Menu, X, GitBranch } from "lucide-react";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  title: "CareOps Agent",
  description: "A Coral-powered family care coordination first mate"
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0f172a"
};

const nav = [
  { href: "/", label: "Dashboard", icon: Home },
  { href: "/flow", label: "How It Works", icon: GitBranch },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/data-sources", label: "Data Sources", icon: Database },
  { href: "/data-import", label: "Import Data", icon: Upload },
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
      <body className={`${inter.className} min-h-screen antialiased`}>
        <script dangerouslySetInnerHTML={{ __html: `
          document.addEventListener('click', function(e) {
            var btn = e.target.closest('[data-menu-toggle]');
            if (btn) {
              document.getElementById('mobile-menu')?.classList.toggle('hidden');
            }
          });
        `}} />
        <div className="flex min-h-screen bg-white">
          <aside className="hidden w-72 border-r border-border bg-surface/70 px-5 py-6 lg:block">
            <div className="mb-8">
              <h1 className="text-2xl font-semibold text-ink">CareOps Agent</h1>
              <p className="mt-2 text-sm text-muted">Family care coordination first mate.</p>
            </div>
            <nav className="space-y-1">
              {nav.map((item) => {
                const Icon = item.icon;
                return (
                  <a key={item.href} href={item.href}
                    className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-ink hover:bg-white hover:shadow-panel [.active-link_&]:bg-white [.active-link_&]:shadow-panel"
                  >
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
                <div className="flex items-center gap-3">
                  <a className="text-sm text-info" href="/packet">Generate</a>
                  <button data-menu-toggle className="rounded-md p-1.5 text-muted hover:bg-surface">
                    <Menu className="h-5 w-5" />
                  </button>
                </div>
              </div>
              <nav id="mobile-menu" className="hidden mt-3 space-y-1 border-t border-border pt-3">
                {nav.map((item) => {
                  const Icon = item.icon;
                  return (
                    <a key={item.href} href={item.href}
                      className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-ink hover:bg-surface"
                    >
                      <Icon className="h-4 w-4 text-muted" />
                      {item.label}
                    </a>
                  );
                })}
              </nav>
            </header>
            <main className="flex-1 px-4 py-6 sm:px-6 lg:px-10">{children}</main>
          </div>
        </div>
      </body>
    </html>
  );
}
