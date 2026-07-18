import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/realdoor/app-shell";
import { GlassCard } from "@/components/realdoor/glass-card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { BookOpen, Calculator, Info, ScaleIcon, ShieldQuestion } from "lucide-react";
import { HUD_SOURCE } from "@/lib/realdoor-data";

export const Route = createFileRoute("/transparency")({
  head: () => ({
    meta: [
      { title: "Transparency — RealDoor" },
      {
        name: "description",
        content:
          "Frozen HUD FY2026 source scope, assistive-not-adjudicative boundaries, deterministic calculations, and citations.",
      },
    ],
  }),
  component: TransparencyPage,
});

const SECTIONS = [
  {
    id: "scope",
    icon: BookOpen,
    title: "Source scope (frozen)",
    body: (
      <div className="space-y-2 text-sm text-muted-foreground">
        <p>
          RealDoor references a <span className="text-foreground">single frozen source</span>:{" "}
          {HUD_SOURCE.program}, {HUD_SOURCE.area}, effective {HUD_SOURCE.effectiveDate}.
        </p>
        <p>
          Nothing else is used to answer readiness questions in this prototype — not property
          waitlists, not PHA-specific rules, not federal or state programs outside HUD MTSP for
          this HMFA.
        </p>
        <p className="border-l-2 border-primary/50 pl-3 text-xs italic">
          {HUD_SOURCE.citation}
        </p>
      </div>
    ),
  },
  {
    id: "boundary",
    icon: ScaleIcon,
    title: "Assistive, not adjudicative",
    body: (
      <div className="space-y-2 text-sm text-muted-foreground">
        <p>
          RealDoor does not approve, deny, rank, score, or state eligibility. It helps you prepare
          confirmed inputs and shows a deterministic comparison against a published rule.
        </p>
        <p>
          Eligibility decisions are made by the property, PHA, or funder that receives your
          completed application — not by RealDoor.
        </p>
      </div>
    ),
  },
  {
    id: "deterministic",
    icon: Calculator,
    title: "Deterministic calculations",
    body: (
      <div className="space-y-2 text-sm text-muted-foreground">
        <p>
          Readiness math is deterministic and inspectable. Given confirmed annualized income and a
          household size, the comparison against each AMI cap is a fixed inequality: no
          probabilistic ranking, no learned scoring, no hidden weighting.
        </p>
        <pre className="mt-2 overflow-x-auto rounded-lg border border-white/10 bg-black/30 p-3 font-mono text-[11px] text-foreground">
{`at_or_under_band(band) =
  confirmed_annual_income <=
  HUD_FY2026_MTSP[hmfa=Sacramento, household_size][band]`}
        </pre>
      </div>
    ),
  },
  {
    id: "uncertainty",
    icon: ShieldQuestion,
    title: "Uncertainty & abstention",
    body: (
      <div className="space-y-2 text-sm text-muted-foreground">
        <p>
          When OCR confidence is below the reuse threshold, RealDoor flags the field for review and
          refuses to reuse it downstream. When a question falls outside the frozen source scope —
          or asks for a decision — RealDoor abstains and points back to confirmed inputs, the
          published rule, and the calculation.
        </p>
        <p>
          “Am I eligible?”, “am I qualified?”, and “decide for me” are always deflected. No
          exceptions.
        </p>
      </div>
    ),
  },
  {
    id: "citations",
    icon: Info,
    title: "Citations",
    body: (
      <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
        <li>HUD FY2026 MTSP Income Limits — Sacramento–Roseville–Folsom, CA HMFA</li>
        <li>24 CFR 5.609 (annual income determination)</li>
        <li>HUD Handbook 4350.3 REV-1, Chapter 5 (income calculation conventions)</li>
        <li>RealDoor Session & Privacy statement</li>
      </ul>
    ),
  },
];

function TransparencyPage() {
  return (
    <AppShell>
      <div className="mb-8 flex flex-col gap-2">
        <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-[oklch(0.82_0.14_260)] ring-1 ring-primary/30">
          Transparency
        </span>
        <h1 className="text-3xl font-semibold tracking-tight text-glow sm:text-4xl">
          How RealDoor thinks — and where it stops
        </h1>
        <p className="max-w-3xl text-sm text-muted-foreground sm:text-base">
          Frozen source, deterministic math, and an explicit boundary between preparing an
          application and deciding on one.
        </p>
      </div>

      <GlassCard className="p-4 sm:p-6">
        <Accordion type="multiple" defaultValue={["scope", "boundary"]} className="w-full">
          {SECTIONS.map((s) => (
            <AccordionItem key={s.id} value={s.id} className="border-white/10">
              <AccordionTrigger className="text-left text-sm">
                <span className="flex items-center gap-2">
                  <s.icon className="h-4 w-4 text-[oklch(0.82_0.14_260)]" aria-hidden />
                  <span className="font-semibold">{s.title}</span>
                </span>
              </AccordionTrigger>
              <AccordionContent>{s.body}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </GlassCard>
    </AppShell>
  );
}
