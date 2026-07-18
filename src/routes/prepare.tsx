import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/realdoor/app-shell";
import { GlassCard } from "@/components/realdoor/glass-card";
import { StatusPill } from "@/components/realdoor/status-pill";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Download, FileText, FolderOpen, Trash2 } from "lucide-react";
import { useRealDoor } from "@/lib/realdoor-store";
import type { ChecklistStatus } from "@/lib/realdoor-data";
import { toast } from "sonner";

export const Route = createFileRoute("/prepare")({
  head: () => ({
    meta: [
      { title: "Prepare — RealDoor" },
      {
        name: "description",
        content:
          "Review a renter-controlled document packet. Export locally. RealDoor never auto-sends anything.",
      },
    ],
  }),
  component: PreparePage,
});

const STATUSES: ChecklistStatus[] = ["confirmed", "present", "review", "expired", "missing"];

function PreparePage() {
  const rd = useRealDoor();
  const [note, setNote] = useState("Contact renter by SMS before packet review.");

  const summary = useMemo(() => {
    const s = { confirmed: 0, present: 0, review: 0, expired: 0, missing: 0 } as Record<
      ChecklistStatus,
      number
    >;
    rd.checklist.forEach((c) => (s[c.status] += 1));
    return s;
  }, [rd.checklist]);

  return (
    <AppShell>
      <div className="mb-8 flex flex-col gap-2">
        <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-[oklch(0.82_0.14_260)] ring-1 ring-primary/30">
          Step 3 of 3 — Prepare
        </span>
        <h1 className="text-3xl font-semibold tracking-tight text-glow sm:text-4xl">
          Your packet, under your control
        </h1>
        <p className="max-w-3xl text-sm text-muted-foreground sm:text-base">
          RealDoor never submits anything. You review, edit, and export a local packet — then you
          decide where it goes.
        </p>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
        {STATUSES.map((s) => (
          <div key={s} className="glass rounded-xl p-3">
            <div className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
              {s}
            </div>
            <div className="mt-1 text-2xl font-semibold tabular-nums">{summary[s]}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.2fr_1fr]">
        <GlassCard className="p-6 sm:p-8">
          <h2 className="text-lg font-semibold">Document checklist</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Text + icon statuses meet WCAG 2.2 AA — status is never conveyed by color alone.
          </p>

          <ul className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2">
            {rd.checklist.map((c) => (
              <li key={c.id} className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-foreground">{c.title}</h3>
                    <p className="mt-1 text-xs text-muted-foreground">{c.description}</p>
                    {c.note && (
                      <p className="mt-2 text-[11px] italic text-muted-foreground">— {c.note}</p>
                    )}
                  </div>
                  <StatusPill status={c.status} />
                </div>

                <div className="mt-3 flex items-center gap-2">
                  <label className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    Set status
                  </label>
                  <Select
                    value={c.status}
                    onValueChange={(v) => rd.setChecklistStatus(c.id, v as ChecklistStatus)}
                  >
                    <SelectTrigger className="h-8 w-40 bg-black/20 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUSES.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </li>
            ))}
          </ul>
        </GlassCard>

        {/* Packet preview */}
        <GlassCard className="p-6 sm:p-8">
          <h2 className="text-lg font-semibold">Packet preview</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Renter-controlled. Nothing leaves this device automatically.
          </p>

          <div className="mt-5 rounded-2xl border border-white/10 bg-gradient-to-br from-[#0e1631] to-[#0a0f22] p-5 shadow-[0_20px_60px_-30px_rgba(0,0,0,0.9)]">
            <div className="flex items-center gap-3">
              <div className="grid h-14 w-11 shrink-0 place-items-center rounded-md bg-gradient-to-b from-[#1a2450] to-[#0e1533] ring-1 ring-primary/30">
                <FolderOpen className="h-5 w-5 text-[oklch(0.82_0.14_260)]" aria-hidden />
              </div>
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold">
                  RealDoor Packet — {rd.cityZip.split(",")[0]}
                </div>
                <div className="text-[11px] text-muted-foreground">
                  {rd.checklist.length} items • Renter-controlled export
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-lg bg-white/[0.02] p-3">
              <div className="flex items-center gap-2 text-xs font-medium">
                <FileText className="h-3.5 w-3.5 text-[oklch(0.82_0.14_260)]" aria-hidden />
                <span>Cover.pdf</span>
              </div>
              <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
                Household size {rd.householdSize} • {rd.cityZip} • Effective 2026-05-01 •
                Assistive-not-adjudicative — no eligibility statement included.
              </p>
            </div>

            <div className="mt-3 space-y-1.5">
              {rd.checklist.slice(0, 5).map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between rounded-md bg-white/[0.02] px-3 py-1.5 text-[11px]"
                >
                  <span className="truncate">{c.title}</span>
                  <StatusPill status={c.status} />
                </div>
              ))}
              {rd.checklist.length > 5 && (
                <div className="text-[11px] text-muted-foreground">
                  +{rd.checklist.length - 5} more items
                </div>
              )}
            </div>
          </div>

          <div className="mt-5">
            <label htmlFor="note" className="text-xs font-medium text-muted-foreground">
              Cover note (editable)
            </label>
            <Textarea
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="mt-1 bg-black/20 text-sm"
              rows={3}
            />
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <Button
              onClick={() =>
                toast.success("Packet export prepared", {
                  description: "Local export only. RealDoor did not send anything.",
                })
              }
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Download className="mr-2 h-4 w-4" aria-hidden />
              Export packet
            </Button>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" className="text-destructive hover:bg-destructive/10">
                  <Trash2 className="mr-2 h-4 w-4" aria-hidden />
                  Delete packet
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="glass-strong border-destructive/30">
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete this packet?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This clears the packet preview only. To hard-delete all session data (extracted
                    fields, checklist, uploads), use the two-step control on the Session & Privacy
                    screen.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Keep</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => toast.success("Packet cleared from preview.")}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Delete packet
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>

          <p className="mt-4 text-[11px] text-muted-foreground">
            RealDoor never auto-sends. You decide when — and where — this packet leaves your device.
          </p>
        </GlassCard>
      </div>
    </AppShell>
  );
}
