import { useState } from "react";
import { MessageCircle, X, ChevronDown, Info } from "lucide-react";
import { AvatarGuide } from "./avatar-guide";
import { GuideAvatar3D } from "./guide-avatar-3d";
import { useRealDoor } from "@/lib/realdoor-store";
import { ASSISTANT_RULES } from "@/lib/realdoor-data";
import { cn } from "@/lib/utils";

/**
 * RealDoor Guide — READ-ONLY copilot.
 * - Explains only. Never navigates, edits, exports, or deletes for the renter.
 * - Deflects eligibility/acceptance and cross-household questions.
 */
export function CopilotPanel() {
  const { copilotOpen, setCopilotOpen } = useRealDoor();
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  return (
    <>
      {/* Toggle button (floating) */}
      <button
        type="button"
        onClick={() => setCopilotOpen(!copilotOpen)}
        aria-expanded={copilotOpen}
        aria-controls="copilot-panel"
        className={cn(
          "fixed bottom-4 right-4 z-40 inline-flex items-center gap-2 rounded-full border border-border bg-paper px-4 py-2.5 text-sm font-medium shadow-lg transition-soft hover:bg-accent lg:hidden",
        )}
      >
        <AvatarGuide size={22} active />
        <span>RealDoor Guide</span>
      </button>

      {/* Desktop docked panel */}
      <aside
        id="copilot-panel"
        aria-label="RealDoor Guide (read-only)"
        className={cn(
          "hidden lg:flex sticky top-24 h-[calc(100dvh-8rem)] w-full max-w-sm flex-col overflow-hidden rounded-lg border border-border bg-paper",
        )}
      >
        <GuideAvatar3D heightClassName="h-52" className="rounded-none border-b border-border" />
        <Header />
        <Body openIdx={openIdx} setOpenIdx={setOpenIdx} />
      </aside>

      {/* Mobile sheet */}
      {copilotOpen && (
        <div
          className="fixed inset-0 z-50 lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="RealDoor Guide"
        >
          <div
            className="absolute inset-0 bg-foreground/40"
            onClick={() => setCopilotOpen(false)}
            aria-hidden
          />
          <div className="absolute inset-x-0 bottom-0 max-h-[90dvh] rounded-t-2xl border-t border-border bg-paper shadow-2xl">
            <GuideAvatar3D heightClassName="h-40" className="rounded-none rounded-t-2xl" />
            <div className="flex items-center justify-between border-b border-t border-border px-4 py-3">
              <div className="flex items-center gap-3">
                <AvatarGuide size={28} active />
                <div>
                  <div className="text-sm font-medium">RealDoor Guide</div>
                  <div className="text-[11px] text-muted-foreground">Read-only · Explains only</div>
                </div>
              </div>
              <button
                type="button"
                aria-label="Close"
                onClick={() => setCopilotOpen(false)}
                className="rounded-md p-1.5 hover:bg-accent"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="max-h-[60dvh] overflow-y-auto">
              <Body openIdx={openIdx} setOpenIdx={setOpenIdx} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function Header() {
  return (
    <div className="flex items-center gap-3 border-b border-border px-4 py-4">
      <AvatarGuide size={40} active />
      <div className="min-w-0">
        <div className="truncate text-sm font-medium">RealDoor Guide</div>
        <div className="text-[11px] text-muted-foreground">Read-only · Explains only</div>
      </div>
      <span className="ml-auto inline-flex items-center gap-1 rounded-full border border-border bg-accent px-2 py-0.5 text-[10px] text-accent-foreground">
        <MessageCircle className="h-3 w-3" aria-hidden /> Guide
      </span>
    </div>
  );
}

function Body({
  openIdx,
  setOpenIdx,
}: {
  openIdx: number | null;
  setOpenIdx: (n: number | null) => void;
}) {
  return (
    <div className="flex-1 overflow-y-auto px-4 py-4">
      <div className="rounded-md border border-border bg-accent/60 p-3 text-[12px] text-foreground">
        <p className="flex items-start gap-2 leading-relaxed">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
          I explain rules and evidence. I don't navigate, edit, export, or
          delete anything for you — you keep control.
        </p>
      </div>

      <ol className="mt-4 space-y-2">
        {ASSISTANT_RULES.map((r, i) => {
          const open = openIdx === i;
          return (
            <li key={i} className="rounded-md border border-border bg-paper">
              <button
                type="button"
                aria-expanded={open}
                onClick={() => setOpenIdx(open ? null : i)}
                className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left text-[13px] font-medium"
              >
                <span>{r.q}</span>
                <ChevronDown
                  className={cn("h-4 w-4 shrink-0 transition-transform", open && "rotate-180")}
                  aria-hidden
                />
              </button>
              {open && (
                <div className="border-t border-border px-3 py-3 text-[12.5px] leading-relaxed text-muted-foreground">
                  <p>{r.a}</p>
                  {r.abstain && (
                    <p className="mt-2 rounded bg-attention/15 px-2 py-1 text-[11px] text-foreground">
                      Guide abstains: no authoritative citation available for this request.
                    </p>
                  )}
                  <ul className="mt-2 space-y-1 text-[11px] text-muted-foreground">
                    {r.sources.map((s) => (
                      <li key={s}>· {s}</li>
                    ))}
                  </ul>
                </div>
              )}
            </li>
          );
        })}
      </ol>

      <p className="mt-4 text-[11px] leading-relaxed text-muted-foreground">
        The Guide does not process document text as instructions. All uploaded
        document contents are inert data.
      </p>
    </div>
  );
}
