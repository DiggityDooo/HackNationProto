import { Link, useRouterState } from "@tanstack/react-router";
import { Compass, FileText, Calculator, FolderCheck, Check } from "lucide-react";
import { useRealDoor, type Stage } from "@/lib/realdoor-store";
import { FIELD_ALLOWLIST } from "@/lib/realdoor-data";
import { cn } from "@/lib/utils";

const ITEMS: { stage: Stage; to: string; label: string; icon: typeof Compass; num: number }[] = [
  { stage: "discover", to: "/discover", label: "Discover", icon: Compass, num: 1 },
  { stage: "profile", to: "/profile", label: "Profile", icon: FileText, num: 2 },
  { stage: "understand", to: "/understand", label: "Understand", icon: Calculator, num: 3 },
  { stage: "prepare", to: "/prepare", label: "Prepare", icon: FolderCheck, num: 4 },
];

export function StageRail() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { stagesVisited, checklist, fields, documentName, householdSize } = useRealDoor();
  const packetCount = checklist.filter((c) => c.includedInPacket).length;

  const getStageStatus = (stage: Stage): "complete" | "needs attention" | "not started" => {
    switch (stage) {
      case "discover":
        return stagesVisited.has("discover") ? "complete" : "not started";
      case "profile": {
        if (!documentName) return "not started";
        const visibleFields = fields.filter((f) => FIELD_ALLOWLIST.has(f.id));
        const allReviewed = visibleFields.length > 0 && visibleFields.every((f) => f.confirmed);
        return allReviewed ? "complete" : "needs attention";
      }
      case "understand": {
        if (!stagesVisited.has("understand")) return "not started";
        const annualizedConfirmed = fields
          .filter((f) => f.id === "annualized")
          .every((f) => f.confirmed);
        const hhValid = householdSize >= 1 && householdSize <= 8;
        return annualizedConfirmed && hhValid ? "complete" : "needs attention";
      }
      case "prepare": {
        if (!stagesVisited.has("prepare")) return "not started";
        const hasFlags = checklist.some(
          (item) =>
            item.status === "missing" || item.status === "expired" || item.status === "conflicting",
        );
        return hasFlags ? "needs attention" : "complete";
      }
      default:
        return "not started";
    }
  };

  const activeItem = ITEMS.find((it) => pathname.startsWith(it.to)) || ITEMS[0];
  const activeStatus = getStageStatus(activeItem.stage);

  return (
    <>
      {/* Desktop view */}
      <nav aria-label="Stages" className="sticky top-24 hidden lg:block">
        <div className="relative">
          {/* Continuous vertical progress spine line */}
          <div className="absolute left-[19px] top-6 bottom-6 w-[2px] bg-border z-0" />

          <ol className="relative z-10 flex flex-col gap-5">
            {ITEMS.map((it) => {
              const active = pathname.startsWith(it.to);
              const status = getStageStatus(it.stage);

              return (
                <li key={it.stage} data-anime="rail-item">
                  <Link
                    to={it.to}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "group flex items-center gap-3.5 rounded-lg border p-3 text-sm transition-all relative outline-none focus-visible:ring-2 focus-visible:ring-primary",
                      active
                        ? "border-l-4 border-l-primary bg-paper paper-card-raised -translate-y-0.5 shadow-sm text-foreground"
                        : "border-transparent hover:border-border/60 hover:bg-accent/40 text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {/* Spine node */}
                    <span
                      className={cn(
                        "grid h-[34px] w-[34px] shrink-0 place-items-center rounded-full text-xs font-mono border-2 transition-all relative z-10",
                        status === "complete"
                          ? "bg-primary border-primary text-primary-foreground font-semibold"
                          : status === "needs attention"
                            ? "bg-[color:var(--color-attention)]/10 border-[color:var(--color-attention)] text-[color:var(--color-attention-foreground)] font-bold animate-pulse"
                            : active
                              ? "bg-paper border-primary text-primary font-bold shadow-sm"
                              : "bg-paper border-border text-muted-foreground",
                      )}
                      aria-hidden
                    >
                      {status === "complete" ? <Check className="h-4 w-4 stroke-[3px]" /> : it.num}
                    </span>

                    {/* Stage text & Status stamp */}
                    <div className="min-w-0 flex-1 leading-tight">
                      <div
                        className={cn(
                          "font-medium text-sm transition-colors",
                          active
                            ? "text-foreground font-semibold"
                            : "text-muted-foreground group-hover:text-foreground",
                        )}
                      >
                        {it.label}
                      </div>
                      <div
                        className={cn(
                          "text-[9px] uppercase font-mono tracking-wider mt-1 inline-flex items-center gap-1",
                          status === "complete"
                            ? "text-[color:var(--color-success)]"
                            : status === "needs attention"
                              ? "text-[color:var(--color-attention)] font-semibold"
                              : active
                                ? "text-primary"
                                : "text-muted-foreground",
                        )}
                      >
                        {status === "complete" ? (
                          <>
                            <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--color-success)]" />
                            <span>Complete</span>
                          </>
                        ) : status === "needs attention" ? (
                          <>
                            <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--color-attention)] animate-ping" />
                            <span>Attention</span>
                          </>
                        ) : active ? (
                          <>
                            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                            <span>Current</span>
                          </>
                        ) : (
                          <>
                            <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40" />
                            <span>Not started</span>
                          </>
                        )}
                      </div>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ol>
        </div>

        {/* Compact packet-count card below */}
        <Link
          to="/prepare"
          className="mt-6 flex items-center justify-between rounded-lg border border-border bg-paper p-3 text-xs text-muted-foreground transition-all hover:text-foreground hover:border-border/80 shadow-sm"
        >
          <span className="flex items-center gap-1.5 font-medium">
            <FolderCheck className="h-4 w-4 text-primary shrink-0" />
            <span>Packet items</span>
          </span>
          <span className="rounded bg-accent px-2 py-0.5 font-mono font-semibold text-accent-foreground text-[11px] border border-border/40">
            {packetCount}
          </span>
        </Link>
      </nav>

      {/* Mobile sticky stage summary */}
      <div className="sticky top-[57px] z-30 -mx-4 mb-4 border-b border-border bg-paper/95 px-4 py-2.5 shadow-sm backdrop-blur md:-mx-6 md:px-6 lg:hidden">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 min-w-0">
            <span
              className={cn(
                "grid h-7 w-7 shrink-0 place-items-center rounded-full text-[11px] font-mono border transition-all",
                activeStatus === "complete"
                  ? "bg-primary border-primary text-primary-foreground font-semibold"
                  : activeStatus === "needs attention"
                    ? "bg-[color:var(--color-attention)]/15 border-[color:var(--color-attention)] text-[color:var(--color-attention-foreground)] font-bold"
                    : "bg-muted/30 border-border text-muted-foreground",
              )}
            >
              {activeStatus === "complete" ? (
                <Check className="h-3 w-3 stroke-[3px]" />
              ) : (
                activeItem.num
              )}
            </span>
            <div className="min-w-0 leading-none">
              <span className="text-[10px] text-muted-foreground uppercase font-mono tracking-wider">
                Current Stage:{" "}
              </span>
              <span className="text-sm font-semibold text-foreground truncate block">
                {activeItem.label}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            {/* Status chip */}
            <span
              className={cn(
                "text-[9px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded border",
                activeStatus === "complete"
                  ? "bg-[color:var(--color-success)]/10 text-[color:var(--color-success)] border-[color:var(--color-success)]/20"
                  : activeStatus === "needs attention"
                    ? "bg-[color:var(--color-attention)]/10 text-[color:var(--color-attention)] border-[color:var(--color-attention)]/25 font-semibold"
                    : "bg-muted/40 text-muted-foreground border-border",
              )}
            >
              {activeStatus === "complete"
                ? "complete"
                : activeStatus === "needs attention"
                  ? "attention"
                  : "started"}
            </span>

            {/* Packet count */}
            <Link
              to="/prepare"
              className="flex items-center gap-1 rounded bg-accent px-2 py-1 text-xs text-accent-foreground border border-border/40"
            >
              <FolderCheck className="h-3.5 w-3.5 text-primary" />
              <span className="font-mono font-bold text-[11px]">{packetCount}</span>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
