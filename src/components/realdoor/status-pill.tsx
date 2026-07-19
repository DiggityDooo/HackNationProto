import { CheckCircle2, FileWarning, AlertTriangle, HelpCircle, AlertCircle } from "lucide-react";
import type { ChecklistStatus } from "@/lib/realdoor-data";

const MAP: Record<ChecklistStatus, { label: string; icon: typeof CheckCircle2; className: string }> = {
  current: {
    label: "Current",
    icon: CheckCircle2,
    className: "bg-[color:var(--color-success)]/10 text-[color:var(--color-success)] ring-1 ring-[color:var(--color-success)]/40",
  },
  missing: {
    label: "Missing",
    icon: FileWarning,
    className: "bg-destructive/10 text-destructive ring-1 ring-destructive/40",
  },
  expired: {
    label: "Expired",
    icon: AlertTriangle,
    className: "bg-attention/15 text-attention-foreground ring-1 ring-attention/50",
  },
  conflicting: {
    label: "Conflicting",
    icon: AlertCircle,
    className: "bg-attention/15 text-attention-foreground ring-1 ring-attention/50",
  },
  unverified: {
    label: "Unverified",
    icon: HelpCircle,
    className: "bg-muted text-muted-foreground ring-1 ring-border",
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
      aria-label={`Status: ${cfg.label}`}
    >
      <Icon className="h-3.5 w-3.5" aria-hidden />
      <span>{cfg.label}</span>
    </span>
  );
}
