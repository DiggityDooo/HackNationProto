import { Link, useRouterState } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Shield, FileText, Calculator, FolderCheck, Lock, Info } from "lucide-react";

const NAV = [
  { to: "/", label: "Profile", icon: FileText },
  { to: "/understand", label: "Understand", icon: Calculator },
  { to: "/prepare", label: "Prepare", icon: FolderCheck },
  { to: "/privacy", label: "Session & Privacy", icon: Lock },
  { to: "/transparency", label: "Transparency", icon: Info },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="min-h-dvh">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-md focus:bg-primary focus:px-3 focus:py-2 focus:text-primary-foreground"
      >
        Skip to main content
      </a>

      <header className="sticky top-0 z-40 border-b border-white/5 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 sm:px-6">
          <Link to="/" className="flex items-center gap-2 transition-soft hover:opacity-90">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-[#4f83ff] to-[#7c5cff] shadow-[0_0_24px_-4px_#4f83ff]">
              <Shield className="h-4 w-4 text-white" aria-hidden />
            </div>
            <div className="min-w-0 leading-tight">
              <div className="text-sm font-semibold tracking-tight text-glow">RealDoor</div>
              <div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                Application-Readiness Copilot
              </div>
            </div>
          </Link>

          <nav aria-label="Primary" className="ml-auto hidden md:block">
            <ul className="flex items-center gap-1">
              {NAV.map((n) => {
                const active = n.to === "/" ? pathname === "/" : pathname.startsWith(n.to);
                return (
                  <li key={n.to}>
                    <Link
                      to={n.to}
                      className={
                        "inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-soft " +
                        (active
                          ? "bg-primary/15 text-foreground glow-border"
                          : "text-muted-foreground hover:bg-white/5 hover:text-foreground")
                      }
                      aria-current={active ? "page" : undefined}
                    >
                      <n.icon className="h-4 w-4" aria-hidden />
                      <span>{n.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>

        {/* Mobile nav */}
        <nav aria-label="Primary mobile" className="md:hidden">
          <ul className="flex overflow-x-auto border-t border-white/5 px-2 py-2">
            {NAV.map((n) => {
              const active = n.to === "/" ? pathname === "/" : pathname.startsWith(n.to);
              return (
                <li key={n.to} className="shrink-0">
                  <Link
                    to={n.to}
                    className={
                      "inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs transition-soft " +
                      (active
                        ? "bg-primary/15 text-foreground"
                        : "text-muted-foreground hover:bg-white/5 hover:text-foreground")
                    }
                    aria-current={active ? "page" : undefined}
                  >
                    <n.icon className="h-4 w-4" aria-hidden />
                    <span>{n.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </header>

      <main id="main" className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:py-12">
        {children}
      </main>

      <footer className="mx-auto max-w-7xl px-4 pb-10 pt-4 text-xs text-muted-foreground sm:px-6">
        <p>
          RealDoor is <span className="text-foreground">assistive, not adjudicative</span>. It does
          not approve, deny, rank, or score any application. Frozen source scope: HUD FY2026 MTSP
          Income Limits — Sacramento–Roseville–Folsom, CA HMFA, effective 2026-05-01.
        </p>
      </footer>
    </div>
  );
}
