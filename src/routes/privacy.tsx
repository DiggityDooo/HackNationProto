import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/realdoor/app-shell";
import { GlassCard } from "@/components/realdoor/glass-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { CircleAlert, Lock, ShieldCheck, Trash2 } from "lucide-react";
import { useRealDoor } from "@/lib/realdoor-store";
import { toast } from "sonner";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Session & Privacy — RealDoor" },
      {
        name: "description",
        content:
          "Local-only, ephemeral session handling. No training on uploads. Export rights and hard deletion.",
      },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  const rd = useRealDoor();
  const navigate = useNavigate();
  const [openStage1, setOpenStage1] = useState(false);
  const [openStage2, setOpenStage2] = useState(false);
  const [typed, setTyped] = useState("");

  const performDelete = () => {
    rd.deleteSession();
    toast.success("Session data deleted", {
      description: "Fields, checklist, and document metadata cleared from memory.",
    });
    setOpenStage2(false);
    setTyped("");
    navigate({ to: "/" });
  };

  return (
    <AppShell>
      <div className="mb-8 flex flex-col gap-2">
        <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-[oklch(0.82_0.14_260)] ring-1 ring-primary/30">
          Session & Privacy
        </span>
        <h1 className="text-3xl font-semibold tracking-tight text-glow sm:text-4xl">
          Local, ephemeral, deletable
        </h1>
        <p className="max-w-3xl text-sm text-muted-foreground sm:text-base">
          Everything you see in RealDoor lives in this browser session. There is no external
          submission workflow, no training on your uploads, and no long-term server storage.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <GlassCard className="p-6">
          <Lock className="h-5 w-5 text-[oklch(0.82_0.14_260)]" aria-hidden />
          <h2 className="mt-3 text-base font-semibold">Ephemeral session</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Your document metadata, extracted fields, and checklist live only in this browser
            session. Closing the tab clears them. Nothing is written to a server-side profile.
          </p>
        </GlassCard>
        <GlassCard className="p-6">
          <ShieldCheck className="h-5 w-5 text-[oklch(0.85_0.15_158)]" aria-hidden />
          <h2 className="mt-3 text-base font-semibold">No training on uploads</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Uploaded document text is treated as inert data. It is never used to train models,
            never routed to third-party AI providers, and never used as instructions.
          </p>
        </GlassCard>
        <GlassCard className="p-6">
          <CircleAlert className="h-5 w-5 text-[oklch(0.88_0.14_80)]" aria-hidden />
          <h2 className="mt-3 text-base font-semibold">You export, you control</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Export the packet locally at any time. RealDoor never auto-sends to a property, PHA, or
            funder. You decide when and where the packet leaves your device.
          </p>
        </GlassCard>
      </div>

      <GlassCard className="mt-6 border-destructive/30 p-6 sm:p-8">
        <div className="flex items-start gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-destructive/15 ring-1 ring-destructive/40">
            <Trash2 className="h-5 w-5 text-[oklch(0.85_0.18_25)]" aria-hidden />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Hard-delete session data</h2>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              Removes all extracted fields, checklist state, and document metadata from memory. This
              is irreversible for the current session.
            </p>
          </div>
        </div>

        <AlertDialog open={openStage1} onOpenChange={setOpenStage1}>
          <AlertDialogTrigger asChild>
            <Button className="mt-5 bg-destructive text-destructive-foreground hover:bg-destructive/90">
              <Trash2 className="mr-2 h-4 w-4" aria-hidden />
              Delete all session data
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="glass-strong border-destructive/40">
            <AlertDialogHeader>
              <AlertDialogTitle>Step 1 of 2 — Confirm deletion intent</AlertDialogTitle>
              <AlertDialogDescription>
                You're about to erase your extracted fields, checklist, and document metadata for
                this session. You can't undo this. If you meant to export first, cancel and use
                Prepare → Export packet.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={(e) => {
                  e.preventDefault();
                  setOpenStage1(false);
                  setOpenStage2(true);
                }}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Continue to step 2
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={openStage2} onOpenChange={setOpenStage2}>
          <AlertDialogContent className="glass-strong border-destructive/40">
            <AlertDialogHeader>
              <AlertDialogTitle>Step 2 of 2 — Type DELETE to confirm</AlertDialogTitle>
              <AlertDialogDescription>
                This clears every field and checklist item in this session. Type{" "}
                <span className="font-mono font-semibold text-foreground">DELETE</span> below.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="space-y-2">
              <Label htmlFor="confirm-input" className="text-xs">
                Confirmation
              </Label>
              <Input
                id="confirm-input"
                value={typed}
                onChange={(e) => setTyped(e.target.value)}
                autoFocus
                placeholder="Type DELETE"
                className="bg-black/25"
              />
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setTyped("")}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                disabled={typed !== "DELETE"}
                onClick={(e) => {
                  e.preventDefault();
                  if (typed === "DELETE") performDelete();
                }}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90 disabled:opacity-40"
              >
                Delete permanently
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </GlassCard>
    </AppShell>
  );
}
