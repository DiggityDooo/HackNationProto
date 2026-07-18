import { CheckCircle2, FileWarning, AlertTriangle, HelpCircle, Circle } from "lucide-react";
import type { ChecklistStatus } from "@/lib/realdoor-data";

const MAP: Record<ChecklistStatus, { label: string; icon: typeof CheckCircle2; className: string }> = {
  confirmed: {
    label: "Confirmed",
    icon: CheckCircle2,
    className: "bg-[oklch(0.72_0.17_158/0.15)] text-[oklch(0.85_0.15_158)] ring-1 ring-[oklch(0.72_0.17_158/0.4)]",
  },
  present: {
    label: "Present",
    icon: Circle,
    className: "bg-primary/15 text-[oklch(0.82_0.14_260)] ring-1 ring-primary/40",
  },
  missing: {
    label: "Missing",
    icon: FileWarning,
    className: "bg-destructive/15 text-[oklch(0.85_0.18_25)] ring-1 ring-destructive/40",
  },
  expired: {
    label: "Expired",
    icon: AlertTriangle,
    className: "bg-warning/15 text-[oklch(0.88_0.14_80)] ring-1 ring-warning/40",
  },
  review: {
    label: "Needs review",
    icon: HelpCircle,
    className: "bg-white/5 text-muted-foreground ring-1 ring-white/15",
  },
};

export function StatusPill({ status }: { status: ChecklistStatus }) {
  const cfg = MAP[status];
  const Icon = cfg.icon;
  return (
    <span
      className={
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium " + cfg.className
      }
    >
      <Icon className="h-3.5 w-3.5" aria-hidden />
      <span>{cfg.label}</span>
    </span>
  );
}
