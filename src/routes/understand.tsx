import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/realdoor/app-shell";
import { GlassCard } from "@/components/realdoor/glass-card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { AlertTriangle, Info, MessageSquare, ScrollText } from "lucide-react";
import { ASSISTANT_RULES, HUD_SOURCE, limitsFor } from "@/lib/realdoor-data";
import { confirmedAnnualIncome, useRealDoor } from "@/lib/realdoor-store";

export const Route = createFileRoute("/understand")({
  head: () => ({
    meta: [
      { title: "Understand — RealDoor" },
      {
        name: "description",
        content:
          "Compare your confirmed annual income to Sacramento Metro 30/50/60/80% AMI thresholds under HUD FY2026 LIHTC.",
      },
    ],
  }),
  component: UnderstandPage,
});

const DEFLECT_TRIGGERS = [
  "am i eligible",
  "am i qualified",
  "decide for me",
  "will i qualify",
  "do i qualify",
  "approve me",
];

function UnderstandPage() {
  const rd = useRealDoor();
  const income = confirmedAnnualIncome(rd.fields);
  const limits = limitsFor(rd.householdSize);
  const bands = ["30", "50", "60", "80"] as const;

  const maxLimit = limits["80"];
  const meterPct = income ? Math.min(100, Math.round((income / (maxLimit * 1.25)) * 100)) : 0;

  // Which band ceilings does income sit under?
  const bandStatus = useMemo(() => {
    if (income == null) return null;
    return bands.map((b) => ({ band: b, cap: limits[b], under: income <= limits[b] }));
  }, [income, limits]);

  return (
    <AppShell>
      <div className="mb-8 flex flex-col gap-2">
        <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-[oklch(0.82_0.14_260)] ring-1 ring-primary/30">
          Step 2 of 3 — Understand
        </span>
        <h1 className="text-3xl font-semibold tracking-tight text-glow sm:text-4xl">
          Where your income sits — and what that means
        </h1>
        <p className="max-w-3xl text-sm text-muted-foreground sm:text-base">
          RealDoor shows a deterministic comparison against the frozen HUD FY2026 MTSP thresholds
          for Sacramento HMFA. It does not approve, deny, rank, or score. Eligibility decisions are
          made by the property or funder that receives your application.
        </p>
      </div>

      {income == null && (
        <div
          role="status"
          className="mb-6 flex items-start gap-3 rounded-xl border border-warning/40 bg-warning/10 p-4 text-sm"
        >
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-[oklch(0.88_0.14_80)]" aria-hidden />
          <div>
            <p className="font-medium text-foreground">Confirmed annualized income required</p>
            <p className="mt-1 text-muted-foreground">
              Confirm the “Annualized gross (derived)” field on your{" "}
              <Link to="/" className="text-[oklch(0.82_0.14_260)] underline underline-offset-2">
                Profile
              </Link>{" "}
              screen before running this comparison. RealDoor won't calculate from unconfirmed
              inputs.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.15fr_1fr]">
        <GlassCard className="p-6 sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold">Threshold gauge</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Household size: {rd.householdSize} • {rd.cityZip}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Label htmlFor="hh" className="text-xs text-muted-foreground">
                Household size
              </Label>
              <Select
                value={String(rd.householdSize)}
                onValueChange={(v) => rd.setHouseholdSize(Number(v))}
              >
                <SelectTrigger id="hh" className="w-28 bg-black/20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5, 6].map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      {n} {n === 1 ? "person" : "people"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Gauge */}
          <div className="mt-6" aria-label="AMI threshold gauge">
            <div className="relative h-4 rounded-full bg-white/5 ring-1 ring-white/10">
              {bands.map((b) => {
                const pos = Math.min(100, (limits[b] / (maxLimit * 1.25)) * 100);
                return (
                  <div
                    key={b}
                    className="absolute top-0 h-4 w-px bg-primary/60"
                    style={{ left: `${pos}%` }}
                    aria-hidden
                  />
                );
              })}
              {income != null && (
                <div
                  className="absolute -top-1 h-6 w-1.5 rounded-full bg-gradient-to-b from-[oklch(0.85_0.15_158)] to-[#4f83ff] shadow-[0_0_18px_2px_rgba(79,131,255,0.5)]"
                  style={{ left: `${meterPct}%` }}
                  role="img"
                  aria-label={`Your confirmed income at $${income.toLocaleString()}`}
                />
              )}
            </div>
            <div className="mt-2 grid grid-cols-4 text-[10px] uppercase tracking-wider text-muted-foreground">
              {bands.map((b) => (
                <div key={b}>
                  <div className="font-semibold text-foreground">{b}% AMI</div>
                  <div>${limits[b].toLocaleString()}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Comparison rows */}
          <div className="mt-8 divide-y divide-white/5 rounded-xl border border-white/10 bg-black/20">
            <div className="grid grid-cols-4 px-4 py-2 text-[11px] uppercase tracking-wider text-muted-foreground">
              <div>Band</div>
              <div>Cap (annual)</div>
              <div>Your income</div>
              <div className="text-right">Comparison</div>
            </div>
            {bands.map((b) => {
              const cap = limits[b];
              const status = income == null ? "—" : income <= cap ? "At or under cap" : "Above cap";
              const cls =
                income == null
                  ? "text-muted-foreground"
                  : income <= cap
                    ? "text-[oklch(0.85_0.15_158)]"
                    : "text-[oklch(0.88_0.14_80)]";
              return (
                <div key={b} className="grid grid-cols-4 items-center px-4 py-3 text-sm">
                  <div className="font-medium">{b}% AMI</div>
                  <div className="tabular-nums">${cap.toLocaleString()}</div>
                  <div className="tabular-nums">
                    {income == null ? "—" : `$${income.toLocaleString()}`}
                  </div>
                  <div className={"text-right text-xs font-medium " + cls}>
                    <span className="inline-flex items-center gap-1.5">
                      <span
                        className={
                          "h-1.5 w-1.5 rounded-full " +
                          (income == null
                            ? "bg-muted-foreground"
                            : income <= cap
                              ? "bg-[oklch(0.72_0.17_158)]"
                              : "bg-[oklch(0.80_0.15_80)]")
                        }
                        aria-hidden
                      />
                      {status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 rounded-xl border border-white/10 bg-white/[0.02] p-4 text-xs">
            <div className="mb-2 text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
              Deterministic formula
            </div>
            <code className="block whitespace-pre-wrap font-mono text-[12px] text-foreground">
              at_or_under_band(band) = confirmed_annual_income ≤ HUD_FY2026_MTSP[hmfa=Sacramento,
              household_size={rd.householdSize}][band]
            </code>
            <p className="mt-2 text-muted-foreground">
              Effective date {HUD_SOURCE.effectiveDate}. Values are compared, not judged. This
              screen never states eligibility.
            </p>
          </div>
        </GlassCard>

        <GlassCard className="p-6 sm:p-8">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <ScrollText className="h-4 w-4" aria-hidden />
            HUD source
          </h2>
          <Accordion type="single" collapsible className="mt-3">
            <AccordionItem value="hud" className="border-white/10">
              <AccordionTrigger className="text-sm">
                {HUD_SOURCE.program}
              </AccordionTrigger>
              <AccordionContent className="text-xs text-muted-foreground">
                <div className="space-y-2">
                  <p>
                    <span className="text-foreground">Area:</span> {HUD_SOURCE.area}
                  </p>
                  <p>
                    <span className="text-foreground">Effective:</span> {HUD_SOURCE.effectiveDate}
                  </p>
                  <p>
                    <span className="text-foreground">Publisher:</span> {HUD_SOURCE.publishedBy}
                  </p>
                  <p className="border-l-2 border-primary/50 pl-3">{HUD_SOURCE.citation}</p>
                  <a
                    href={HUD_SOURCE.url}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="inline-block text-[oklch(0.82_0.14_260)] underline underline-offset-2"
                  >
                    HUD MTSP portal
                  </a>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <h2 className="mt-6 flex items-center gap-2 text-lg font-semibold">
            <MessageSquare className="h-4 w-4" aria-hidden />
            Rules assistant
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Answers reference frozen sources. Decision questions are deflected.
          </p>
          <AssistantPanel />
        </GlassCard>
      </div>
    </AppShell>
  );
}

function AssistantPanel() {
  const [q, setQ] = useState("");
  const [answer, setAnswer] = useState<null | { a: string; sources: string[]; deflected: boolean }>(
    null,
  );

  const ask = (query: string) => {
    const norm = query.toLowerCase();
    if (DEFLECT_TRIGGERS.some((t) => norm.includes(t))) {
      const seed = ASSISTANT_RULES[2];
      setAnswer({ a: seed.a, sources: seed.sources, deflected: true });
      return;
    }
    const match = ASSISTANT_RULES.find(
      (r) =>
        r.q.toLowerCase().includes(norm) ||
        norm.split(" ").some((w) => w.length > 3 && r.q.toLowerCase().includes(w)),
    );
    if (match) {
      setAnswer({ a: match.a, sources: match.sources, deflected: false });
    } else {
      setAnswer({
        a: "I don't have a frozen source for that question in this prototype. Try asking about the calculation, geography, effective date, or eligibility deflection.",
        sources: ["RealDoor Transparency Statement"],
        deflected: false,
      });
    }
  };

  return (
    <div className="mt-4">
      <div className="flex flex-wrap gap-2">
        {ASSISTANT_RULES.map((r) => (
          <button
            key={r.q}
            onClick={() => {
              setQ(r.q);
              ask(r.q);
            }}
            className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[11px] text-muted-foreground transition-soft hover:border-primary/40 hover:bg-primary/10 hover:text-foreground"
          >
            {r.q}
          </button>
        ))}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (q.trim()) ask(q);
        }}
        className="mt-3 flex gap-2"
      >
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Ask about the calculation, geography, or rule…"
          aria-label="Ask the rules assistant"
          className="flex-1 rounded-md border border-white/10 bg-black/25 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:border-primary"
        />
        <Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/90">
          Ask
        </Button>
      </form>

      {answer && (
        <div
          role="status"
          aria-live="polite"
          className={
            "mt-4 rounded-xl border p-4 text-sm " +
            (answer.deflected
              ? "border-warning/40 bg-warning/5"
              : "border-white/10 bg-white/[0.03]")
          }
        >
          <div className="flex items-start gap-2">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-[oklch(0.82_0.14_260)]" aria-hidden />
            <p className="text-foreground/90">{answer.a}</p>
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {answer.sources.map((s) => (
              <span
                key={s}
                className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-[oklch(0.82_0.14_260)] ring-1 ring-primary/30"
              >
                {s}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
