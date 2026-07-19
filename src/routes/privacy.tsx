import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/realdoor/app-shell";
import { PaperCard } from "@/components/realdoor/glass-card";
import { ShieldCheck, Lock, Trash2, FileText } from "lucide-react";
import { useRealDoor } from "@/lib/realdoor-store";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Session & Privacy — RealDoor" },
      {
        name: "description",
        content:
          "Ephemeral session, hard delete, redacted activity log. No auto-send to properties.",
      },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  const rd = useRealDoor();
  return (
    <AppShell>
      <header className="mb-6">
        <div className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
          Session &amp; Privacy
        </div>
        <h1 className="ink-title mt-1 text-3xl sm:text-4xl">How RealDoor protects you</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Everything below is a product commitment enforced by the prototype's behavior.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        <PaperCard className="p-5">
          <div className="flex items-center gap-2">
            <Lock className="h-4 w-4 text-primary" aria-hidden />
            <h2 className="text-sm font-semibold">Ephemeral session</h2>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            State lives in-memory only. Refreshing the page starts a new session. There is no
            server-side account.
          </p>
        </PaperCard>
        <PaperCard className="p-5">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-primary" aria-hidden />
            <h2 className="text-sm font-semibold">Untrusted document text</h2>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Uploaded document text is inert data. It cannot instruct the assistant. Only an
            allowlist of field IDs is displayed.
          </p>
        </PaperCard>
        <PaperCard className="p-5">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" aria-hidden />
            <h2 className="text-sm font-semibold">No send workflow</h2>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            RealDoor does not transmit your packet. Downloads are renter-controlled files. Nothing
            goes to any property or authority.
          </p>
        </PaperCard>
        <PaperCard className="p-5">
          <div className="flex items-center gap-2">
            <Trash2 className="h-4 w-4 text-primary" aria-hidden />
            <h2 className="text-sm font-semibold">Delete anytime</h2>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Use <span className="font-medium">Delete session</span> in the top bar. A two-step
            confirmation clears fields, checklist, and log immediately.
          </p>
        </PaperCard>
      </div>

      <PaperCard className="mt-6 p-5">
        <h2 className="text-sm font-semibold">Activity log (redacted)</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Actions only. No raw document contents are recorded.
        </p>
        <ol className="mt-3 max-h-80 overflow-auto rounded-md border border-border bg-paper text-[12.5px]">
          {rd.activity.length === 0 && (
            <li className="px-3 py-2 text-muted-foreground">No activity yet.</li>
          )}
          {rd.activity.map((a, i) => (
            <li key={i} className="flex items-start justify-between gap-3 border-b border-border px-3 py-2 last:border-b-0">
              <div>
                <div className="font-medium">{a.action}</div>
                <div className="text-[11px] text-muted-foreground">
                  {a.stage} · {new Date(a.ts).toLocaleTimeString()}
                </div>
              </div>
              {a.meta && (
                <div className="max-w-[50%] truncate text-right text-[11px] text-muted-foreground">
                  {Object.entries(a.meta).map(([k, v]) => `${k}=${v}`).join(", ")}
                </div>
              )}
            </li>
          ))}
        </ol>
      </PaperCard>
    </AppShell>
  );
}
