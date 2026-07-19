import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/realdoor/app-shell";
import { PaperCard } from "@/components/realdoor/glass-card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { StatusPill } from "@/components/realdoor/status-pill";
import { Download, FileArchive, FileText, HandHeart, CheckCircle2 } from "lucide-react";
import { FROZEN, FIELD_ALLOWLIST } from "@/lib/realdoor-data";
import { useRealDoor } from "@/lib/realdoor-store";
import { toast } from "sonner";

export const Route = createFileRoute("/prepare")({
  head: () => ({
    meta: [
      { title: "Prepare — RealDoor" },
      {
        name: "description",
        content: "Assemble a renter-controlled packet. Export as PDF or ZIP. No submission.",
      },
    ],
  }),
  component: PreparePage,
});

function PreparePage() {
  const rd = useRealDoor();
  useEffect(() => { rd.visitStage("prepare"); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);
  if (!rd.consented) return <Navigate to="/" />;

  const [preDownloadConfirmed, setPreDownloadConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);

  const counts = useMemo(() => {
    const c: Record<string, number> = { current: 0, missing: 0, expired: 0, conflicting: 0, unverified: 0 };
    rd.checklist.forEach((it) => { c[it.status] = (c[it.status] || 0) + 1; });
    return c;
  }, [rd.checklist]);

  const confirmedFields = rd.fields.filter((f) => f.confirmed && FIELD_ALLOWLIST.has(f.id));
  const includedItems = rd.checklist.filter((c) => c.includedInPacket);

  const buildPacketText = () => {
    const lines: string[] = [];
    lines.push("REALDOOR — APPLICATION-READINESS PACKET (SYNTHETIC PROTOTYPE)");
    lines.push("=".repeat(64));
    lines.push(`Applicant: ${rd.applicantName || "(none)"}`);
    lines.push(`Household size: ${rd.householdSize}`);
    lines.push(`Location: ${rd.cityZip}`);
    lines.push(`Simulation date: ${FROZEN.simulationDate}`);
    lines.push("");
    lines.push(`Rule scope: ${FROZEN.program}`);
    lines.push(`Area: ${FROZEN.area}`);
    lines.push(`Effective: ${FROZEN.effectiveDate}`);
    lines.push("");
    lines.push("Confirmed fields:");
    confirmedFields.forEach((f) => {
      lines.push(`  - ${f.label}: ${f.value}  [confidence ${f.confidenceLabel}]`);
    });
    lines.push("");
    lines.push("Checklist:");
    includedItems.forEach((c) => {
      lines.push(`  [${c.status.toUpperCase()}] ${c.title}`);
      if (c.note) lines.push(`      note: ${c.note}`);
    });
    lines.push("");
    lines.push("Notice: RealDoor is assistive, not adjudicative. Nothing was submitted.");
    return lines.join("\n");
  };

  const exportPdf = async () => {
    setBusy(true);
    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF({ unit: "pt", format: "letter" });
      const margin = 48;
      let y = margin;
      const line = (text: string, opts: { size?: number; bold?: boolean; color?: [number, number, number] } = {}) => {
        const size = opts.size ?? 11;
        doc.setFontSize(size);
        doc.setFont("helvetica", opts.bold ? "bold" : "normal");
        if (opts.color) doc.setTextColor(...opts.color);
        else doc.setTextColor(30, 34, 60);
        const wrapped = doc.splitTextToSize(text, 515);
        wrapped.forEach((w: string) => {
          if (y > 740) { doc.addPage(); y = margin; }
          doc.text(w, margin, y);
          y += size + 4;
        });
      };
      line("RealDoor — Application-Readiness Packet", { size: 18, bold: true });
      line("Synthetic prototype · Not an eligibility decision", { size: 10, color: [110, 110, 130] });
      y += 8;
      line(`Applicant: ${rd.applicantName || "(none)"}`);
      line(`Household size: ${rd.householdSize}`);
      line(`Location: ${rd.cityZip}`);
      line(`Simulation date: ${FROZEN.simulationDate}`);
      y += 6;
      line("Rule scope", { size: 12, bold: true });
      line(`${FROZEN.program}`);
      line(`${FROZEN.area}`);
      line(`Effective ${FROZEN.effectiveDate}`);
      y += 6;
      line("Confirmed fields", { size: 12, bold: true });
      confirmedFields.forEach((f) => line(`• ${f.label}: ${f.value}   (confidence ${f.confidenceLabel})`));
      if (confirmedFields.length === 0) line("(none confirmed yet)", { color: [140, 140, 155] });
      y += 6;
      line("Checklist", { size: 12, bold: true });
      includedItems.forEach((c) => {
        line(`[${c.status.toUpperCase()}] ${c.title}`, { bold: true });
        if (c.note) line(`     note: ${c.note}`, { size: 10, color: [110, 110, 130] });
      });
      y += 10;
      line("RealDoor is assistive, not adjudicative. Nothing was submitted.", { size: 9, color: [110, 110, 130] });
      doc.save("realdoor-packet.pdf");
      rd.logActivity({ stage: "prepare", action: "packet_pdf_exported", meta: { items: includedItems.length } });
      toast.success("Packet PDF downloaded");
    } finally {
      setBusy(false);
    }
  };

  const exportZip = async () => {
    setBusy(true);
    try {
      const JSZip = (await import("jszip")).default;
      const zip = new JSZip();
      zip.file("README.txt", buildPacketText());
      zip.file(
        "packet.json",
        JSON.stringify(
          {
            applicant: rd.applicantName,
            householdSize: rd.householdSize,
            cityZip: rd.cityZip,
            simulationDate: FROZEN.simulationDate,
            ruleScope: FROZEN,
            confirmedFields: confirmedFields.map((f) => ({
              id: f.id,
              label: f.label,
              value: f.value,
              confidenceLabel: f.confidenceLabel,
            })),
            checklist: includedItems,
          },
          null,
          2,
        ),
      );
      const blob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "realdoor-packet.zip";
      a.click();
      URL.revokeObjectURL(url);
      rd.logActivity({ stage: "prepare", action: "packet_zip_exported", meta: { items: includedItems.length } });
      toast.success("Packet ZIP downloaded");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AppShell>
      <header className="mb-6">
        <div className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
          Stage 4 · Prepare
        </div>
        <h1 className="ink-title mt-1 text-3xl sm:text-4xl">Assemble your packet</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          A packet is renter-controlled. RealDoor does not send anything to any property.
          Checklist statuses describe evidence, not eligibility.
        </p>
      </header>

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
        <StatCard label="Current" value={counts.current} tone="success" />
        <StatCard label="Missing" value={counts.missing} tone="destructive" />
        <StatCard label="Expired" value={counts.expired} tone="attention" />
        <StatCard label="Conflicting" value={counts.conflicting} tone="attention" />
        <StatCard label="Unverified" value={counts.unverified} tone="muted" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
        <PaperCard className="p-0">
          <div className="border-b border-border px-4 py-3">
            <div className="text-sm font-medium">Checklist</div>
            <div className="text-[11px] text-muted-foreground">Include or exclude each item from the packet.</div>
          </div>
          <ul className="divide-y divide-border">
            {rd.checklist.map((c) => (
              <li key={c.id} className="flex items-start gap-3 px-4 py-3">
                <Checkbox
                  id={`inc-${c.id}`}
                  checked={c.includedInPacket}
                  onCheckedChange={() => rd.toggleChecklistIncluded(c.id)}
                  aria-label={`Include ${c.title}`}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Label htmlFor={`inc-${c.id}`} className="text-sm font-medium">
                      {c.title}
                    </Label>
                    <StatusPill status={c.status} />
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">{c.description}</p>
                  {c.note && <p className="mt-1 text-[11px] text-muted-foreground">Note: {c.note}</p>}
                </div>
              </li>
            ))}
          </ul>
        </PaperCard>

        <div className="space-y-6">
          <PaperCard className="p-5">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" aria-hidden />
              <h2 className="text-sm font-semibold">Packet preview</h2>
            </div>
            <div className="mt-3 max-h-72 overflow-auto rounded-md border border-border bg-paper p-3 font-mono text-[11.5px] leading-relaxed">
              <pre className="whitespace-pre-wrap break-words">{buildPacketText()}</pre>
            </div>
          </PaperCard>

          <PaperCard className="p-5">
            <div className="flex items-center gap-2">
              <Download className="h-4 w-4 text-primary" aria-hidden />
              <h2 className="text-sm font-semibold">Export</h2>
            </div>
            <div className="mt-3 rounded-md border border-border bg-accent/50 p-3 text-xs">
              <div className="flex items-start gap-2">
                <Checkbox
                  id="pre-dl"
                  checked={preDownloadConfirmed}
                  onCheckedChange={(v) => setPreDownloadConfirmed(v === true)}
                />
                <Label htmlFor="pre-dl" className="leading-relaxed">
                  I understand this packet is for my own use, is not submitted anywhere, and is
                  labeled synthetic. I have reviewed the included items above.
                </Label>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button disabled={!preDownloadConfirmed || busy} onClick={exportPdf}>
                <FileText className="h-4 w-4" aria-hidden />
                <span>Download PDF</span>
              </Button>
              <Button
                variant="outline"
                disabled={!preDownloadConfirmed || busy}
                onClick={exportZip}
              >
                <FileArchive className="h-4 w-4" aria-hidden />
                <span>Download ZIP</span>
              </Button>
            </div>
            <p className="mt-3 text-[11px] text-muted-foreground">
              No send workflow. There is no button that transmits your packet.
            </p>
          </PaperCard>

          <PaperCard className="p-5">
            <div className="flex items-center gap-2">
              <HandHeart className="h-4 w-4 text-primary" aria-hidden />
              <h2 className="text-sm font-semibold">You did the hard part</h2>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              You confirmed the facts. A qualified human at the property, housing authority, or
              nonprofit navigator will review your application and decide.
            </p>
            <ul className="mt-3 space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                Bring the packet to your intake appointment or navigator meeting.
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                Ask the property to explain any evidence they still need.
              </li>
            </ul>
          </PaperCard>
        </div>
      </div>
    </AppShell>
  );
}

function StatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "success" | "destructive" | "attention" | "muted";
}) {
  const cls =
    tone === "success"
      ? "border-[color:var(--color-success)]/40 text-[color:var(--color-success)]"
      : tone === "destructive"
        ? "border-destructive/40 text-destructive"
        : tone === "attention"
          ? "border-attention/50 text-foreground"
          : "border-border text-muted-foreground";
  return (
    <div className={"rounded-md border bg-paper p-3 " + cls}>
      <div className="text-2xl font-semibold tabular-nums">{value}</div>
      <div className="text-[11px] uppercase tracking-wider">{label}</div>
    </div>
  );
}
