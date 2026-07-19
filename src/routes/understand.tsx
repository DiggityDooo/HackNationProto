import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { AppShell } from "@/components/realdoor/app-shell";
import { PaperCard } from "@/components/realdoor/glass-card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { AlertCircle, Calculator, BookOpen } from "lucide-react";
import { FROZEN, limitsFor, ASSISTANT_RULES } from "@/lib/realdoor-data";
import { confirmedAnnualIncome, useRealDoor } from "@/lib/realdoor-store";

export const Route = createFileRoute("/understand")({
  head: () => ({
    meta: [
      { title: "Understand — RealDoor" },
      {
        name: "description",
        content:
          "Cited HUD FY2026 rules for Boston HMFA and a neutral, deterministic calculation ledger. Not an eligibility decision.",
      },
    ],
  }),
  component: UnderstandPage,
});

function UnderstandPage() {
  const rd = useRealDoor();
  useEffect(() => { rd.visitStage("understand"); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);
  if (!rd.consented) return <Navigate to="/" />;

  const income = confirmedAnnualIncome(rd.fields);
  const limits = limitsFor(rd.householdSize);
  const threshold60 = limits["60"];

  return (
    <AppShell>
      <header className="mb-6">
        <div className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
          Stage 3 · Understand
        </div>
        <h1 className="ink-title mt-1 text-3xl sm:text-4xl">Rules and calculation</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Every number here is deterministic and cited. The comparison against the frozen 60% AMI
          threshold is <span className="font-medium text-foreground">not</span> an eligibility decision.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
        <PaperCard className="p-5">
          <div className="flex items-center gap-2">
            <Calculator className="h-4 w-4 text-primary" aria-hidden />
            <h2 className="text-sm font-semibold">Neutral calculation ledger</h2>
          </div>
          {income === null ? (
            <div className="mt-4 rounded-md border border-attention/50 bg-attention/15 p-3 text-sm">
              <AlertCircle className="mr-1 inline h-4 w-4" aria-hidden />
              Confirm the derived <span className="font-medium">Annualized gross</span> field on the
              Profile screen to compute a comparison. RealDoor abstains when inputs are unconfirmed.
            </div>
          ) : (
            <dl className="mt-4 divide-y divide-border rounded-md border border-border">
              <Row k="Confirmed annualized income" v={`$${income.toLocaleString()}`} />
              <Row k="Formula" v="gross per period × 26 (bi-weekly)" />
              <Row k="Rule scope" v={`${FROZEN.program} — ${FROZEN.area}`} />
              <Row k="Effective date" v={FROZEN.effectiveDate} />
              <Row k="Household size" v={`${rd.householdSize}`} />
              <Row
                k="Frozen 60% AMI threshold"
                v={`$${threshold60.toLocaleString()} / year`}
              />
              <Row
                k="Comparison"
                v={income <= threshold60
                  ? `Confirmed income ≤ 60% AMI threshold (Δ $${(threshold60 - income).toLocaleString()})`
                  : `Confirmed income > 60% AMI threshold (Δ $${(income - threshold60).toLocaleString()})`}
              />
            </dl>
          )}

          <div className="mt-4 rounded-md border border-border bg-accent/40 p-3 text-xs text-muted-foreground">
            <span className="font-medium text-foreground">Not an eligibility decision.</span>{" "}
            This is a numeric comparison against a frozen published threshold. The property, PHA,
            or funder that receives your application makes the eligibility determination using
            their own verification.
          </div>
        </PaperCard>

        <PaperCard className="p-5">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-primary" aria-hidden />
            <h2 className="text-sm font-semibold">Cited rules Q&amp;A</h2>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            RealDoor answers only from a fixed rules corpus. When no authoritative citation
            applies, it abstains.
          </p>

          <Accordion type="single" collapsible className="mt-3">
            {ASSISTANT_RULES.map((r, i) => (
              <AccordionItem key={i} value={`i-${i}`}>
                <AccordionTrigger className="text-left text-sm">{r.q}</AccordionTrigger>
                <AccordionContent>
                  <p className="text-sm leading-relaxed text-muted-foreground">{r.a}</p>
                  {r.abstain && (
                    <p className="mt-2 rounded bg-attention/15 px-2 py-1 text-[11px] text-foreground">
                      Abstained — no authoritative citation.
                    </p>
                  )}
                  <ul className="mt-2 space-y-1 text-[11px] text-muted-foreground">
                    {r.sources.map((s) => (
                      <li key={s}>· {s}</li>
                    ))}
                  </ul>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </PaperCard>
      </div>

      <PaperCard className="mt-6 p-5">
        <h2 className="text-sm font-semibold">Evidence for this rule</h2>
        <p className="mt-1 text-xs text-muted-foreground">Displayed outside chat, always visible.</p>
        <div className="mt-3 rounded-md border border-border bg-paper p-4 text-sm">
          <div className="font-medium">{FROZEN.program}</div>
          <div className="text-muted-foreground">{FROZEN.area}</div>
          <div className="mt-2 text-xs text-muted-foreground">
            Effective {FROZEN.effectiveDate} · Simulation date {FROZEN.simulationDate} · Evidence
            currency {FROZEN.evidenceCurrencyDays} days.
          </div>
          <p className="mt-3 text-xs">{FROZEN.citation}</p>
          <a
            href={FROZEN.url}
            target="_blank"
            rel="noreferrer noopener"
            className="mt-2 inline-block text-xs text-primary underline underline-offset-2"
          >
            HUD MTSP Income Limits reference →
          </a>
        </div>
      </PaperCard>
    </AppShell>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-start justify-between gap-3 px-3 py-2 text-sm">
      <dt className="text-muted-foreground">{k}</dt>
      <dd className="text-right font-medium tabular-nums">{v}</dd>
    </div>
  );
}
