import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";

import { UploadCloud, ArrowRight, ShieldCheck, Lock, FileText } from "lucide-react";
import { WelcomeStage } from "@/components/realdoor/welcome-stage";
import { AvatarGuide } from "@/components/realdoor/avatar-guide";
import { PaperCard } from "@/components/realdoor/glass-card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useRealDoor } from "@/lib/realdoor-store";
import { SCENARIOS, FROZEN, type ScenarioId } from "@/lib/realdoor-data";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Welcome — RealDoor" },
      {
        name: "description",
        content:
          "RealDoor helps Boston-area renters prepare affordable-housing applications with confirmed inputs and HUD FY2026 LIHTC references. Assistive, not adjudicative.",
      },
      { property: "og:title", content: "RealDoor — Application-Readiness Copilot" },
      {
        property: "og:description",
        content:
          "Prepare Boston affordable-housing applications with deterministic HUD FY2026 LIHTC readiness checks.",
      },
    ],
  }),
  component: WelcomePage,
});

function WelcomePage() {
  
  const nav = useNavigate();
  const rd = useRealDoor();
  const [agreed, setAgreed] = useState(false);
  const [busy, setBusy] = useState(false);

  const start = (scenario: ScenarioId | null, uploaded?: File) => {
    if (!agreed) {
      toast.error("Please review and accept the consent notice first.");
      return;
    }
    setBusy(true);
    rd.giveConsent();
    if (scenario) {
      rd.loadScenario(scenario);
    } else {
      rd.loadDemoDocument(uploaded?.name);
    }
    rd.visitStage("profile");
    setTimeout(() => nav({ to: "/profile" }), 120);
  };

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <a
        href="#welcome-main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-md focus:bg-primary focus:px-3 focus:py-2 focus:text-primary-foreground"
      >
        Skip to main content
      </a>

      {/* Persistent badges bar */}
      <div className="border-b border-border bg-paper">
        <div className="mx-auto flex max-w-[1400px] flex-wrap items-center gap-x-3 gap-y-1.5 px-4 py-2 text-[11px] sm:px-6">
          <span className="badge-persist">
            <ShieldCheck className="h-3 w-3" aria-hidden />
            You confirm. A qualified human decides.
          </span>
          <span className="badge-persist">
            Boston pilot · FY 2026 rules · effective {FROZEN.effectiveDate}
          </span>
          <span
            className="badge-persist"
            style={{ background: "color-mix(in oklab, var(--color-attention) 22%, var(--color-paper))" }}
          >
            Prototype — use synthetic documents only
          </span>
        </div>
      </div>

      <main id="welcome-main" className="mx-auto max-w-[1400px] px-4 py-10 sm:px-6 lg:py-16">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-center">
          <div>
            <div>
              <div className="flex items-center gap-3">
                <AvatarGuide size={44} active />
                <span className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                  RealDoor Guide · read-only
                </span>
              </div>
              <h1 className="ink-title mt-5 text-4xl leading-tight sm:text-5xl">
                Get ready to apply — with confidence you own.
              </h1>
              <p className="mt-4 max-w-xl text-base leading-relaxed text-muted-foreground">
                RealDoor helps Boston-area renters prepare affordable-housing applications
                under frozen HUD FY 2026 LIHTC rules. You confirm every field. RealDoor never
                approves, denies, ranks, or scores anyone.
              </p>
            </div>

            <PaperCard className="mt-8 p-5 sm:p-6" raised>
              <h2 className="text-sm font-semibold">Consent before you upload</h2>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                <li className="flex gap-2">
                  <Lock className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                  Session is ephemeral. Nothing is submitted; nothing leaves your browser session.
                </li>
                <li className="flex gap-2">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                  Uploaded document text is treated as inert data — never as instructions.
                </li>
                <li className="flex gap-2">
                  <FileText className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                  Only an allowlist of fields is extracted. You review and confirm each one.
                </li>
              </ul>

              <div className="mt-4 flex items-start gap-3 rounded-md border border-border bg-accent/60 p-3">
                <Checkbox
                  id="consent"
                  checked={agreed}
                  onCheckedChange={(v) => setAgreed(v === true)}
                  aria-describedby="consent-desc"
                />
                <Label htmlFor="consent" className="text-sm leading-relaxed">
                  <span className="font-medium">I understand this is a synthetic prototype.</span>
                  <span id="consent-desc" className="mt-1 block text-muted-foreground">
                    I will only use synthetic documents. See{" "}
                    <Link to="/privacy" className="underline underline-offset-2">Session &amp; Privacy</Link>{" "}
                    and{" "}
                    <Link to="/transparency" className="underline underline-offset-2">Transparency</Link>.
                  </span>
                </Label>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <label
                  className={
                    "group flex cursor-pointer flex-col items-start rounded-md border border-dashed border-border bg-paper p-4 transition-soft hover:border-primary/60 hover:bg-accent/60 " +
                    (agreed ? "" : "opacity-60")
                  }
                >
                  <UploadCloud className="h-5 w-5 text-primary" aria-hidden />
                  <span className="mt-2 text-sm font-medium">Upload synthetic document</span>
                  <span className="mt-1 text-xs text-muted-foreground">
                    PDF, JPG, or PNG. Local only.
                  </span>
                  <input
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg"
                    disabled={!agreed || busy}
                    onChange={(e) => start(null, e.target.files?.[0] ?? undefined)}
                    className="sr-only"
                  />
                </label>

                <button
                  type="button"
                  disabled={!agreed || busy}
                  onClick={() => start("HH-003")}
                  className="group flex flex-col items-start rounded-md border border-primary/40 bg-primary/10 p-4 text-left transition-soft hover:bg-primary/15 disabled:opacity-60"
                >
                  <ArrowRight className="h-5 w-5 text-primary" aria-hidden />
                  <span className="mt-2 text-sm font-medium">Try a synthetic example</span>
                  <span className="mt-1 text-xs text-muted-foreground">
                    HH-003 · Avery Moss (Boston household of 3)
                  </span>
                </button>
              </div>

              <div className="mt-4 grid gap-2 text-xs sm:grid-cols-3">
                <ScenarioButton
                  id="HH-003"
                  disabled={!agreed || busy}
                  onClick={(id) => start(id)}
                  title="HH-003 · Avery Moss"
                  subtitle="Default · invite correction"
                />
                <ScenarioButton
                  id="HH-005"
                  disabled={!agreed || busy}
                  onClick={(id) => start(id)}
                  title="HH-005 · Tess Alder"
                  subtitle="Expired evidence"
                />
                <ScenarioButton
                  id="HH-002"
                  disabled={!agreed || busy}
                  onClick={(id) => start(id)}
                  title="HH-002 · Jonas Vale"
                  subtitle="Injection attempt"
                />
              </div>
            </PaperCard>
          </div>

          <div className="hidden lg:block">
            <WelcomeStage />
          </div>
        </div>
      </main>
    </div>
  );
}

function ScenarioButton({
  id,
  title,
  subtitle,
  onClick,
  disabled,
}: {
  id: ScenarioId;
  title: string;
  subtitle: string;
  onClick: (id: ScenarioId) => void;
  disabled?: boolean;
}) {
  const s = SCENARIOS[id];
  return (
    <button
      type="button"
      onClick={() => onClick(id)}
      disabled={disabled}
      className="rounded-md border border-border bg-paper p-3 text-left transition-soft hover:border-primary/40 hover:bg-accent/60 disabled:opacity-60"
      aria-label={`Load scenario ${title}: ${s.headline}`}
    >
      <div className="text-[13px] font-medium">{title}</div>
      <div className="text-[11px] text-muted-foreground">{subtitle}</div>
    </button>
  );
}
