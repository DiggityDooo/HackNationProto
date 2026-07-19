import { Link, useRouterState } from "@tanstack/react-router";
import { Compass, FileText, Calculator, FolderCheck, Check } from "lucide-react";
import { useRealDoor, type Stage } from "@/lib/realdoor-store";
import { cn } from "@/lib/utils";

const ITEMS: { stage: Stage; to: string; label: string; icon: typeof Compass; num: number }[] = [
  { stage: "discover", to: "/discover", label: "Discover", icon: Compass, num: 1 },
  { stage: "profile", to: "/profile", label: "Profile", icon: FileText, num: 2 },
  { stage: "understand", to: "/understand", label: "Understand", icon: Calculator, num: 3 },
  { stage: "prepare", to: "/prepare", label: "Prepare", icon: FolderCheck, num: 4 },
];

export function StageRail() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { stagesVisited, checklist } = useRealDoor();
  const packetCount = checklist.filter((c) => c.includedInPacket).length;

  return (
    <nav aria-label="Stages" className="sticky top-24 hidden lg:block">
      <ol className="flex flex-col gap-2">
        {ITEMS.map((it) => {
          const active = pathname.startsWith(it.to);
          const stamped = stagesVisited.has(it.stage);
          const Icon = it.icon;
          return (
            <li key={it.stage}>
              <Link
                to={it.to}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "group flex items-center gap-3 rounded-md border px-3 py-2.5 text-sm transition-soft",
                  active
                    ? "border-primary/40 bg-accent text-foreground"
                    : "border-transparent hover:border-border hover:bg-accent/60 text-muted-foreground hover:text-foreground",
                )}
              >
                <span
                  className={cn(
                    "grid h-7 w-7 shrink-0 place-items-center rounded-full text-[11px] font-medium ring-1",
                    stamped
                      ? "bg-primary text-primary-foreground ring-primary/50"
                      : active
                        ? "bg-paper text-foreground ring-primary/40"
                        : "bg-paper text-muted-foreground ring-border",
                  )}
                  aria-hidden
                >
                  {stamped ? <Check className="h-3.5 w-3.5" /> : it.num}
                </span>
                <span className="flex min-w-0 items-center gap-2">
                  <Icon className="h-4 w-4 shrink-0" aria-hidden />
                  <span className="truncate">{it.label}</span>
                </span>
              </Link>
            </li>
          );
        })}
      </ol>

      <Link
        to="/prepare"
        className="mt-4 flex items-center justify-between rounded-md border border-border bg-paper px-3 py-2 text-xs text-muted-foreground transition-soft hover:text-foreground"
      >
        <span>Packet items</span>
        <span className="rounded-full bg-accent px-2 py-0.5 font-medium text-accent-foreground">
          {packetCount}
        </span>
      </Link>
    </nav>
  );
}
