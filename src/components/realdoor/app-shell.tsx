import { useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Sun, Moon, Trash2, Menu, X, Info, Shield } from "lucide-react";
import { useRealDoor } from "@/lib/realdoor-store";
import { FROZEN } from "@/lib/realdoor-data";
import { StageRail } from "./stage-rail";
import { CopilotPanel } from "./copilot-panel";
import { AvatarGuide } from "./avatar-guide";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/discover", label: "Discover" },
  { to: "/profile", label: "Profile" },
  { to: "/understand", label: "Understand" },
  { to: "/prepare", label: "Prepare" },
] as const;

const META_NAV = [
  { to: "/privacy", label: "Session & Privacy" },
  { to: "/transparency", label: "Transparency" },
] as const;

export function AppShell({
  children,
  showRail = true,
  showCopilot = true,
}: {
  children: ReactNode;
  showRail?: boolean;
  showCopilot?: boolean;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { theme, toggleTheme } = useRealDoor();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-md focus:bg-primary focus:px-3 focus:py-2 focus:text-primary-foreground"
      >
        Skip to main content
      </a>

      {/* Persistent top badges bar */}
      <div className="border-b border-border bg-paper">
        <div className="mx-auto flex max-w-[1400px] flex-wrap items-center gap-x-3 gap-y-1.5 px-4 py-2 text-[11px] sm:px-6">
          <span className="badge-persist">
            <Shield className="h-3 w-3" aria-hidden />
            You confirm. A qualified human decides.
          </span>
          <span className="badge-persist" title={`Effective ${FROZEN.effectiveDate} · Simulation ${FROZEN.simulationDate} · Evidence ${FROZEN.evidenceCurrencyDays}-day window`}>
            <Info className="h-3 w-3" aria-hidden />
            {FROZEN.contextBadge}
          </span>
          <span className="badge-persist" style={{ background: "color-mix(in oklab, var(--color-attention) 22%, var(--color-paper))" }}>
            Prototype — synthetic documents only
          </span>
        </div>
      </div>

      <header className="sticky top-0 z-40 border-b border-border bg-paper/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1400px] items-center gap-4 px-4 py-3 sm:px-6">
          <Link to="/" className="flex items-center gap-2.5 transition-soft hover:opacity-90">
            <AvatarGuide size={32} />
            <div className="min-w-0 leading-tight">
              <div className="ink-title text-base font-semibold">RealDoor</div>
              <div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                Application-Readiness Copilot
              </div>
            </div>
          </Link>

          <nav aria-label="Primary" className="ml-auto hidden md:block">
            <ul className="flex items-center gap-1">
              {NAV.map((n) => {
                const active = pathname.startsWith(n.to);
                return (
                  <li key={n.to}>
                    <Link
                      to={n.to}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "inline-flex items-center rounded-md px-3 py-1.5 text-sm transition-soft",
                        active
                          ? "bg-accent text-foreground"
                          : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
                      )}
                    >
                      {n.label}
                    </Link>
                  </li>
                );
              })}
              <li className="mx-2 h-4 w-px bg-border" aria-hidden />
              {META_NAV.map((n) => {
                const active = pathname.startsWith(n.to);
                return (
                  <li key={n.to}>
                    <Link
                      to={n.to}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "inline-flex items-center rounded-md px-3 py-1.5 text-sm transition-soft",
                        active
                          ? "bg-accent text-foreground"
                          : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
                      )}
                    >
                      {n.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="ml-auto flex items-center gap-1 md:ml-2">
            <button
              type="button"
              aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
              onClick={toggleTheme}
              className="rounded-md p-2 text-muted-foreground transition-soft hover:bg-accent hover:text-foreground"
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <DeleteSessionDialog />
            <button
              type="button"
              aria-label="Open menu"
              onClick={() => setMenuOpen((v) => !v)}
              className="rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-foreground md:hidden"
            >
              {menuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {menuOpen && (
          <nav aria-label="Mobile menu" className="border-t border-border bg-paper md:hidden">
            <ul className="mx-auto flex max-w-[1400px] flex-col p-2">
              {[...NAV, ...META_NAV].map((n) => {
                const active = pathname.startsWith(n.to);
                return (
                  <li key={n.to}>
                    <Link
                      to={n.to}
                      onClick={() => setMenuOpen(false)}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "block rounded-md px-3 py-2 text-sm",
                        active ? "bg-accent text-foreground" : "text-muted-foreground hover:bg-accent/60",
                      )}
                    >
                      {n.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        )}
      </header>

      <div className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6 lg:py-10">
        <div
          className={cn(
            "grid gap-8",
            showRail && showCopilot
              ? "lg:grid-cols-[180px_minmax(0,1fr)_360px]"
              : showRail
                ? "lg:grid-cols-[180px_minmax(0,1fr)]"
                : "",
          )}
        >
          {showRail && <StageRail />}
          <main id="main" className="min-w-0">
            {children}
          </main>
          {showCopilot && <CopilotPanel />}
        </div>
      </div>

      <footer className="mx-auto max-w-[1400px] px-4 pb-10 pt-4 text-xs text-muted-foreground sm:px-6">
        <p>
          RealDoor is <span className="text-foreground">assistive, not adjudicative</span>. It does
          not approve, deny, rank, or score any application. Frozen source scope:{" "}
          {FROZEN.program} — {FROZEN.area}, effective {FROZEN.effectiveDate}. Simulation date{" "}
          {FROZEN.simulationDate}. Evidence currency window {FROZEN.evidenceCurrencyDays} days.
        </p>
      </footer>
    </div>
  );
}

function DeleteSessionDialog() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [confirmText, setConfirmText] = useState("");
  const { deleteSession } = useRealDoor();

  const reset = () => {
    setStep(1);
    setConfirmText("");
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) reset();
      }}
    >
      <DialogTrigger asChild>
        <button
          type="button"
          aria-label="Delete session"
          className="inline-flex items-center gap-1.5 rounded-md border border-border bg-paper px-2.5 py-1.5 text-xs text-muted-foreground transition-soft hover:border-destructive/60 hover:text-destructive"
        >
          <Trash2 className="h-3.5 w-3.5" aria-hidden />
          <span className="hidden sm:inline">Delete session</span>
        </button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete this session</DialogTitle>
          <DialogDescription>
            All extracted fields, checklist state, and activity in this session are removed from
            memory. Nothing was submitted to any property.
          </DialogDescription>
        </DialogHeader>
        {step === 1 ? (
          <div className="space-y-3 text-sm">
            <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
              <li>Uploaded document metadata will be forgotten.</li>
              <li>All confirmations and checklist edits will be cleared.</li>
              <li>Redacted activity log will reset.</li>
            </ul>
          </div>
        ) : (
          <div className="space-y-2">
            <Label htmlFor="confirm-delete">Type <span className="font-mono">DELETE</span> to confirm</Label>
            <Input
              id="confirm-delete"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              autoComplete="off"
            />
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => { setOpen(false); reset(); }}>Cancel</Button>
          {step === 1 ? (
            <Button variant="destructive" onClick={() => setStep(2)}>Continue</Button>
          ) : (
            <Button
              variant="destructive"
              disabled={confirmText !== "DELETE"}
              onClick={() => {
                deleteSession();
                setOpen(false);
                reset();
                toast.success("Session deleted", { description: "All in-memory data cleared." });
              }}
            >
              Delete session
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
