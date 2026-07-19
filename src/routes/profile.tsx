import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/realdoor/app-shell";
import { PaperCard } from "@/components/realdoor/glass-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle2, Edit3, AlertCircle, FileText, Search } from "lucide-react";
import { useRealDoor } from "@/lib/realdoor-store";
import { FIELD_ALLOWLIST, FROZEN, type ExtractedField } from "@/lib/realdoor-data";
import { isEvidenceExpired } from "@/lib/realdoor-store";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Profile — RealDoor" },
      {
        name: "description",
        content: "Review OCR-extracted fields from a synthetic document and confirm each one.",
      },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const rd = useRealDoor();

  useEffect(() => {
    rd.visitStage("profile");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!rd.consented || !rd.documentName) {
    return <Navigate to="/" />;
  }

  const visibleFields = useMemo(
    () => rd.fields.filter((f) => FIELD_ALLOWLIST.has(f.id)),
    [rd.fields],
  );
  const confirmedCount = visibleFields.filter((f) => f.confirmed).length;
  const total = visibleFields.length;
  const pct = total ? Math.round((confirmedCount / total) * 100) : 0;
  const allReviewed = confirmedCount === total;
  const expired = isEvidenceExpired(rd.documentDate);

  const [highlightFieldId, setHighlightFieldId] = useState<string | null>(null);

  return (
    <AppShell>
      <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
            Stage 2 · Profile
          </div>
          <h1 className="ink-title mt-1 text-3xl sm:text-4xl">Review what we read</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            RealDoor extracts an allowlist of fields from your synthetic document. Confidence is
            an extraction-quality label, not an approval signal. Confirm or edit every field.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="border-primary/40 bg-primary/10 text-foreground">
            {confirmedCount}/{total} confirmed · {pct}%
          </Badge>
          <Button
            size="sm"
            disabled={!allReviewed || rd.fields.every((f) => f.confirmed)}
            onClick={() => {
              rd.confirmAll();
              toast.success("All fields confirmed");
            }}
          >
            Confirm all reviewed
          </Button>
        </div>
      </header>

      {expired && (
        <div
          role="status"
          className="mb-6 flex items-start gap-2 rounded-md border border-attention/50 bg-attention/15 p-3 text-sm"
        >
          <AlertCircle className="mt-0.5 h-4 w-4" aria-hidden />
          <div>
            <div className="font-medium">Evidence outside currency window</div>
            <div className="text-xs text-muted-foreground">
              Document date {rd.documentDate}. Simulation date {FROZEN.simulationDate}. Evidence
              older than {FROZEN.evidenceCurrencyDays} days is flagged as expired. Not an
              eligibility decision.
            </div>
          </div>
        </div>
      )}

      {/* Desktop: side-by-side. Mobile: tabs. */}
      <div className="hidden lg:grid lg:grid-cols-[1.05fr_1fr] lg:gap-6">
        <DocumentPanel highlightFieldId={highlightFieldId} onHighlight={setHighlightFieldId} />
        <FieldsPanel onHover={setHighlightFieldId} highlight={highlightFieldId} />
      </div>

      <div className="lg:hidden">
        <Tabs defaultValue="fields">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="doc">Document</TabsTrigger>
            <TabsTrigger value="fields">Fields</TabsTrigger>
          </TabsList>
          <TabsContent value="doc" className="mt-3">
            <DocumentPanel highlightFieldId={highlightFieldId} onHighlight={setHighlightFieldId} />
          </TabsContent>
          <TabsContent value="fields" className="mt-3">
            <FieldsPanel onHover={setHighlightFieldId} highlight={highlightFieldId} />
          </TabsContent>
        </Tabs>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-md border border-border bg-paper p-4 text-sm">
        <div className="flex items-center gap-2">
          <Label htmlFor="hh" className="whitespace-nowrap">Household size</Label>
          <Input
            id="hh"
            type="number"
            min={1}
            max={6}
            value={rd.householdSize}
            onChange={(e) => rd.setHouseholdSize(Math.min(6, Math.max(1, Number(e.target.value) || 1)))}
            className="w-20"
          />
          <span className="text-xs text-muted-foreground">{rd.cityZip}</span>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <a href="/understand">Continue to Understand</a>
          </Button>
        </div>
      </div>
    </AppShell>
  );
}

function DocumentPanel({
  highlightFieldId,
  onHighlight,
}: {
  highlightFieldId: string | null;
  onHighlight: (id: string | null) => void;
}) {
  const rd = useRealDoor();
  const highlighted = rd.fields.find((f) => f.id === highlightFieldId);

  const rendered = useMemo(() => {
    if (!highlighted) return rd.evidenceSnippet;
    // Insert a mark around the first occurrence of the evidence text
    const idx = rd.evidenceSnippet.indexOf(highlighted.evidence.text);
    if (idx < 0) return rd.evidenceSnippet;
    const before = rd.evidenceSnippet.slice(0, idx);
    const match = rd.evidenceSnippet.slice(idx, idx + highlighted.evidence.text.length);
    const after = rd.evidenceSnippet.slice(idx + highlighted.evidence.text.length);
    return { before, match, after };
  }, [highlighted, rd.evidenceSnippet]);

  return (
    <PaperCard className="p-0">
      <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
        <div className="flex min-w-0 items-center gap-2">
          <FileText className="h-4 w-4 shrink-0 text-primary" aria-hidden />
          <div className="min-w-0">
            <div className="truncate text-sm font-medium">{rd.documentName}</div>
            <div className="text-[11px] text-muted-foreground">
              {rd.documentType} · {rd.sizeKb} KB · {rd.pages} page · {rd.ocrEngine}
            </div>
          </div>
        </div>
        <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-medium text-accent-foreground">
          SYNTHETIC
        </span>
      </div>

      <div
        className="scan relative m-4 overflow-hidden rounded-md border border-border bg-paper p-4 font-mono text-[12.5px] leading-relaxed text-foreground"
        onMouseLeave={() => onHighlight(null)}
      >
        <pre className="whitespace-pre-wrap break-words">
          {typeof rendered === "string" ? (
            rendered
          ) : (
            <>
              {rendered.before}
              <mark className="rounded bg-primary/25 px-0.5 py-0.5 text-foreground">
                {rendered.match}
              </mark>
              {rendered.after}
            </>
          )}
        </pre>
      </div>

      <div className="border-t border-border px-4 py-3 text-[11px] text-muted-foreground">
        <div className="flex items-start gap-1.5">
          <Search className="mt-0.5 h-3 w-3" aria-hidden />
          Hover a field on the right to highlight its evidence in the document.
        </div>
      </div>
    </PaperCard>
  );
}

function FieldsPanel({
  highlight,
  onHover,
}: {
  highlight: string | null;
  onHover: (id: string | null) => void;
}) {
  const rd = useRealDoor();
  const list = rd.fields.filter((f) => FIELD_ALLOWLIST.has(f.id));

  return (
    <PaperCard className="p-0">
      <div className="border-b border-border px-4 py-3">
        <div className="text-sm font-medium">Extracted fields (allowlist)</div>
        <div className="text-[11px] text-muted-foreground">
          Uploaded document text is inert. Only these field IDs are read.
        </div>
      </div>
      <ul className="divide-y divide-border">
        {list.map((f) => (
          <FieldRow
            key={f.id}
            f={f}
            highlighted={highlight === f.id}
            onHover={onHover}
          />
        ))}
      </ul>
    </PaperCard>
  );
}

function FieldRow({
  f,
  highlighted,
  onHover,
}: {
  f: ExtractedField;
  highlighted: boolean;
  onHover: (id: string | null) => void;
}) {
  const rd = useRealDoor();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(f.value);

  return (
    <li
      onMouseEnter={() => onHover(f.id)}
      onFocus={() => onHover(f.id)}
      className={cn(
        "px-4 py-3 transition-soft",
        highlighted && "bg-accent/60",
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
              {f.label}
            </span>
            <ConfidencePill f={f} />
            {f.confirmed && (
              <span
                aria-label="Confirmed by you"
                className="inline-flex items-center gap-1 rounded-full bg-[color:var(--color-success)]/10 px-2 py-0.5 text-[10px] font-medium text-[color:var(--color-success)] ring-1 ring-[color:var(--color-success)]/40"
              >
                <CheckCircle2 className="h-3 w-3" aria-hidden />
                Confirmed
              </span>
            )}
          </div>
          {editing ? (
            <Input
              autoFocus
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              className="mt-2 h-8 max-w-xs text-sm"
            />
          ) : (
            <div className="mt-1 text-[15px] font-medium text-foreground">{f.value}</div>
          )}
          {f.suggested && !f.confirmed && (
            <button
              type="button"
              className="mt-1 text-[11px] text-primary underline underline-offset-2"
              onClick={() => rd.setField(f.id, { value: f.suggested! })}
            >
              Suggested: {f.suggested}
            </button>
          )}
        </div>
        <div className="flex shrink-0 gap-2">
          {editing ? (
            <>
              <Button
                size="sm"
                onClick={() => {
                  rd.setField(f.id, { value: draft });
                  rd.confirmField(f.id);
                  setEditing(false);
                  toast.success("Field updated and confirmed");
                }}
              >
                Save
              </Button>
              <Button size="sm" variant="outline" onClick={() => { setDraft(f.value); setEditing(false); }}>
                Cancel
              </Button>
            </>
          ) : (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setEditing(true)}
                aria-label={`Edit ${f.label}`}
              >
                <Edit3 className="h-3.5 w-3.5" aria-hidden />
                <span>Edit</span>
              </Button>
              <Button
                size="sm"
                disabled={f.confirmed}
                onClick={() => rd.confirmField(f.id)}
                aria-label={`Confirm ${f.label}`}
              >
                <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
                <span>Confirm</span>
              </Button>
            </>
          )}
        </div>
      </div>
      <div className="mt-2 text-[11px] text-muted-foreground">
        Evidence · page {f.evidence.page}, line {f.evidence.line} · &ldquo;{f.evidence.text}&rdquo;
      </div>
    </li>
  );
}

function ConfidencePill({ f }: { f: ExtractedField }) {
  const label = f.confidenceLabel;
  const pct = Math.round(f.confidence * 100);
  const cls =
    label === "High"
      ? "bg-[color:var(--color-success)]/10 text-[color:var(--color-success)] ring-[color:var(--color-success)]/40"
      : label === "Medium"
        ? "bg-accent text-accent-foreground ring-border"
        : "bg-attention/20 text-foreground ring-attention/50";
  return (
    <span
      className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ring-1", cls)}
      title="Extraction quality — not an approval signal"
    >
      Confidence: {label} · {pct}%
    </span>
  );
}
