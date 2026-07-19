import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/realdoor/app-shell";
import { PaperCard } from "@/components/realdoor/glass-card";
import { Info, ShieldOff, Compass, HandHeart } from "lucide-react";
import { FROZEN } from "@/lib/realdoor-data";

export const Route = createFileRoute("/transparency")({
  head: () => ({
    meta: [
      { title: "Transparency — RealDoor" },
      {
        name: "description",
        content:
          "Frozen scope, boundary of the tool, and the questions RealDoor will not answer.",
      },
    ],
  }),
  component: TransparencyPage,
});

function TransparencyPage() {
  return (
    <AppShell>
      <header className="mb-6">
        <div className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
          Transparency
        </div>
        <h1 className="ink-title mt-1 text-3xl sm:text-4xl">
          You confirm. A qualified human decides.
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          RealDoor is assistive, not adjudicative. It does not approve, deny, rank, or score any
          application, applicant, household, or property.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        <PaperCard className="p-5">
          <div className="flex items-center gap-2">
            <Info className="h-4 w-4 text-primary" aria-hidden />
            <h2 className="text-sm font-semibold">Frozen source scope</h2>
          </div>
          <ul className="mt-3 space-y-1 text-sm">
            <li><span className="text-muted-foreground">Program: </span>{FROZEN.program}</li>
            <li><span className="text-muted-foreground">Area: </span>{FROZEN.area}</li>
            <li><span className="text-muted-foreground">Effective: </span>{FROZEN.effectiveDate}</li>
            <li><span className="text-muted-foreground">Simulation date: </span>{FROZEN.simulationDate}</li>
            <li><span className="text-muted-foreground">Evidence currency: </span>{FROZEN.evidenceCurrencyDays} days</li>
            <li><span className="text-muted-foreground">Published by: </span>{FROZEN.publishedBy}</li>
          </ul>
          <p className="mt-3 text-xs text-muted-foreground">{FROZEN.citation}</p>
        </PaperCard>

        <PaperCard className="p-5">
          <div className="flex items-center gap-2">
            <ShieldOff className="h-4 w-4 text-primary" aria-hidden />
            <h2 className="text-sm font-semibold">What RealDoor will not do</h2>
          </div>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>· Approve, deny, rank, or score any application or applicant.</li>
            <li>· Predict acceptance at a property.</li>
            <li>· Determine availability of any unit.</li>
            <li>· Compare or share data across households, including demo scenarios.</li>
            <li>· Follow instructions found inside uploaded documents.</li>
            <li>· Submit or transmit your packet.</li>
          </ul>
        </PaperCard>

        <PaperCard className="p-5">
          <div className="flex items-center gap-2">
            <Compass className="h-4 w-4 text-primary" aria-hidden />
            <h2 className="text-sm font-semibold">What RealDoor will do</h2>
          </div>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>· Extract an allowlist of fields from your synthetic document.</li>
            <li>· Show you the exact evidence for each extracted value.</li>
            <li>· Cite the frozen HUD FY 2026 rule and effective date.</li>
            <li>· Compute deterministic income calculations with clear formulas.</li>
            <li>· Flag evidence outside a 60-day currency window.</li>
            <li>· Let you delete the session at any time.</li>
          </ul>
        </PaperCard>

        <PaperCard className="p-5">
          <div className="flex items-center gap-2">
            <HandHeart className="h-4 w-4 text-primary" aria-hidden />
            <h2 className="text-sm font-semibold">Human handoff</h2>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Bring your packet to the property, housing authority, or a nonprofit navigator. They
            are the ones who verify, decide, and communicate outcomes.
          </p>
        </PaperCard>
      </div>
    </AppShell>
  );
}
