import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useMemo, useRef, useState } from "react";
import {
  UploadCloud,
  FileText,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import { AppShell } from "@/components/realdoor/app-shell";
import { GlassCard } from "@/components/realdoor/glass-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useRealDoor } from "@/lib/realdoor-store";
import { EVIDENCE_SNIPPET, FIELD_ALLOWLIST } from "@/lib/realdoor-data";
import { toast } from "sonner";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Profile — RealDoor" },
      {
        name: "description",
        content:
          "Upload a synthetic pay stub or benefit letter and review OCR-extracted fields before RealDoor reuses them.",
      },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const rd = useRealDoor();
  const [dragOver, setDragOver] = useState(false);
  const [hasDoc, setHasDoc] = useState(rd.documentName.length > 0);
  const inputRef = useRef<HTMLInputElement>(null);

  const visibleFields = useMemo(
    () => rd.fields.filter((f) => FIELD_ALLOWLIST.has(f.id)),
    [rd.fields],
  );
  const confirmedCount = visibleFields.filter((f) => f.confirmed).length;
  const total = visibleFields.length;
  const pct = total ? Math.round((confirmedCount / total) * 100) : 0;

  const handleFile = useCallback(
    (file?: File) => {
      const name = file?.name || "paystub_2026-05-22_sacrt.pdf";
      rd.loadDemoDocument(name);
      setHasDoc(true);
      toast.success("Synthetic document loaded", {
        description: "OCR fields ready for your review. Nothing is submitted.",
      });
    },
    [rd],
  );

  return (
    <AppShell>
      <div className="mb-8 flex flex-col gap-2">
        <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-[oklch(0.82_0.14_260)] ring-1 ring-primary/30">
          <Sparkles className="h-3.5 w-3.5" aria-hidden />
          Step 1 of 3 — Profile
        </span>
        <h1 className="text-3xl font-semibold tracking-tight text-glow sm:text-4xl">
          Start with one document
        </h1>
        <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">
          Drop a synthetic pay stub or benefit letter. RealDoor extracts a small allowlist of fields
          on-device, shows you the evidence, and asks you to confirm before anything is reused.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.05fr_1fr]">
        {/* Upload */}
        <GlassCard className="p-6 sm:p-8">
          <h2 className="text-lg font-semibold">Upload document</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            PDFs, JPG, or PNG up to 10 MB. Synthetic prototype — do not upload real personal data.
          </p>

          <label
            htmlFor="file-input"
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              handleFile(e.dataTransfer.files?.[0]);
            }}
            className={
              "mt-5 flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-12 text-center transition-soft " +
              (dragOver
                ? "border-primary bg-primary/10 glow-border"
                : "border-white/10 bg-white/[0.02] hover:border-primary/50 hover:bg-primary/5")
            }
          >
            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-primary/15 ring-1 ring-primary/30">
              <UploadCloud className="h-6 w-6 text-[oklch(0.82_0.14_260)]" aria-hidden />
            </div>
            <div className="mt-4 text-sm font-medium">
              Drop file here or <span className="text-[oklch(0.82_0.14_260)]">browse</span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Or use a synthetic demo document below
            </p>
            <input
              id="file-input"
              ref={inputRef}
              type="file"
              accept=".pdf,.png,.jpg,.jpeg"
              className="sr-only"
              onChange={(e) => handleFile(e.target.files?.[0] || undefined)}
            />
          </label>

          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              variant="secondary"
              onClick={() => handleFile()}
              className="bg-white/5 hover:bg-white/10"
            >
              <FileText className="mr-2 h-4 w-4" aria-hidden />
              Use synthetic pay stub
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                rd.loadDemoDocument("ssa_award_letter_2026.pdf");
                setHasDoc(true);
                toast.success("Synthetic benefit letter loaded");
              }}
              className="hover:bg-white/5"
            >
              Use synthetic benefit letter
            </Button>
          </div>

          {hasDoc && (
            <div className="mt-6 grid grid-cols-2 gap-3 rounded-xl border border-white/10 bg-black/20 p-4 text-xs sm:grid-cols-4">
              <Meta label="File" value={rd.documentName} />
              <Meta label="Type" value={rd.documentType} />
              <Meta label="Size" value={`${rd.sizeKb} KB`} />
              <Meta label="Pages" value={String(rd.pages)} />
              <Meta label="Uploaded" value={new Date(rd.uploadedAt).toLocaleString()} />
              <Meta label="OCR engine" value={rd.ocrEngine} />
              <Meta label="Household size" value={String(rd.householdSize)} />
              <Meta label="Location" value={rd.cityZip} />
            </div>
          )}

          <div className="mt-5 flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.02] p-4 text-xs text-muted-foreground">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[oklch(0.85_0.15_158)]" aria-hidden />
            <p>
              Document text is treated as <span className="text-foreground">inert data</span>: no
              instructions inside uploads are followed. Only the fields on the allowlist are shown,
              and RealDoor never trains on your uploads.
            </p>
          </div>
        </GlassCard>

        {/* Evidence snippet */}
        <GlassCard className="p-6 sm:p-8" aria-labelledby="evidence-h">
          <div className="flex items-center justify-between">
            <h2 id="evidence-h" className="text-lg font-semibold">
              Evidence snippet
            </h2>
            <Badge className="bg-white/5 text-xs text-muted-foreground ring-1 ring-white/10">
              Page 1 / 1
            </Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Rendered as a scanned document so you can spot mismatches.
          </p>

          <pre
            aria-label="Scanned document evidence"
            className="mt-4 max-h-[360px] overflow-auto rounded-xl border border-white/10 bg-[#0b0f1c] p-4 font-mono text-[11px] leading-relaxed text-[oklch(0.88_0.03_255)] shadow-inner"
          >
            {EVIDENCE_SNIPPET}
          </pre>
        </GlassCard>
      </div>

      {/* Progress + fields */}
      <GlassCard className="mt-6 p-6 sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold">Confirm extracted fields</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Edit any value that doesn't match the evidence. Confirmation is required before
              RealDoor reuses a value in the Understand or Prepare steps.
            </p>
          </div>
          <div
            className="min-w-[220px]"
            role="status"
            aria-live="polite"
            aria-label={`${confirmedCount} of ${total} fields confirmed`}
          >
            <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
              <span>Progress</span>
              <span className="font-medium text-foreground">
                {confirmedCount} of {total} fields confirmed
              </span>
            </div>
            <Progress value={pct} className="h-2 bg-white/5 [&>div]:bg-gradient-to-r [&>div]:from-[#4f83ff] [&>div]:to-[oklch(0.72_0.17_158)]" />
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          {visibleFields.map((f) => (
            <FieldRow key={f.id} field={f} />
          ))}
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            Only allowlisted fields are shown. Everything else in the document is ignored.
          </p>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              onClick={() => rd.loadDemoDocument(rd.documentName)}
              className="hover:bg-white/5"
            >
              Reset values
            </Button>
            <Button
              onClick={() => {
                rd.confirmAll();
                toast.success("All fields confirmed", {
                  description: "You can now review Understand with confirmed inputs.",
                });
              }}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <CheckCircle2 className="mr-2 h-4 w-4" aria-hidden />
              Confirm all
            </Button>
          </div>
        </div>
      </GlassCard>
    </AppShell>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <div className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">{label}</div>
      <div className="truncate text-foreground">{value}</div>
    </div>
  );
}

function FieldRow({ field }: { field: ReturnType<typeof useRealDoor>["fields"][number] }) {
  const rd = useRealDoor();
  const confPct = Math.round(field.confidence * 100);
  const low = field.confidence < 0.8;

  return (
    <div
      className={
        "rounded-xl border p-4 transition-soft " +
        (field.confirmed
          ? "border-[oklch(0.72_0.17_158/0.4)] bg-[oklch(0.72_0.17_158/0.06)]"
          : low
            ? "border-warning/40 bg-warning/5"
            : "border-white/10 bg-white/[0.02]")
      }
    >
      <div className="flex items-center justify-between gap-2">
        <Label htmlFor={`f-${field.id}`} className="text-xs font-medium text-muted-foreground">
          {field.label}
        </Label>
        <div className="flex items-center gap-2">
          <span
            className={
              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium " +
              (low
                ? "bg-warning/15 text-[oklch(0.88_0.14_80)] ring-1 ring-warning/40"
                : "bg-white/5 text-muted-foreground ring-1 ring-white/10")
            }
            title="OCR confidence"
          >
            {low && <AlertCircle className="h-3 w-3" aria-hidden />}
            OCR {confPct}%
          </span>
          {field.confirmed && (
            <span className="inline-flex items-center gap-1 rounded-full bg-[oklch(0.72_0.17_158/0.15)] px-2 py-0.5 text-[10px] font-medium text-[oklch(0.85_0.15_158)] ring-1 ring-[oklch(0.72_0.17_158/0.4)]">
              <CheckCircle2 className="h-3 w-3" aria-hidden />
              Confirmed
            </span>
          )}
        </div>
      </div>

      <Input
        id={`f-${field.id}`}
        value={field.value}
        onChange={(e) => rd.setField(field.id, { value: e.target.value, confirmed: false })}
        className="mt-2 bg-black/20 text-sm"
      />

      {field.suggested && (
        <p className="mt-2 text-[11px] text-muted-foreground">
          Suggested correction:{" "}
          <button
            type="button"
            onClick={() => rd.setField(field.id, { value: field.suggested!, confirmed: false })}
            className="text-[oklch(0.82_0.14_260)] underline underline-offset-2 hover:opacity-90"
          >
            {field.suggested}
          </button>
        </p>
      )}

      <div className="mt-3 flex justify-end">
        <Button
          size="sm"
          variant={field.confirmed ? "secondary" : "default"}
          onClick={() => rd.confirmField(field.id)}
          className={
            field.confirmed
              ? "bg-white/5 text-muted-foreground hover:bg-white/10"
              : "bg-primary text-primary-foreground hover:bg-primary/90"
          }
          disabled={field.confirmed}
        >
          {field.confirmed ? "Confirmed" : "Confirm value"}
        </Button>
      </div>
    </div>
  );
}
