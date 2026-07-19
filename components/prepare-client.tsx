"use client";

import { useState, useTransition } from "react";
import { previewPacket, deletePacket } from "@/app/actions";
import type { PacketPreview } from "@/app/actions";
import type { ChecklistEval } from "@/lib/rules/checklist";

function statusBadgeClass(s: string): string {
  switch (s) {
    case "present":
    case "confirmed":
      return "ok";
    case "missing":
    case "expired":
      return "bad";
    case "needs review":
      return "warn";
    default:
      return "info";
  }
}

function needsAttention(status: string): boolean {
  return status !== "present" && status !== "confirmed";
}

export function PrepareClient({ initialChecklist }: { initialChecklist: ChecklistEval[] }) {
  const [packet, setPacket] = useState<PacketPreview | null>(() =>
    initialChecklist.length
      ? {
          fields: [],
          checklist: initialChecklist,
          readinessNote:
            "This packet shows your confirmed inputs and document readiness. It is NOT an eligibility decision and is never auto-submitted.",
        }
      : null,
  );
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();

  async function handlePreview() {
    start(async () => {
      const res = await previewPacket();
      if (res.status === "success" && res.data) {
        setPacket(res.data);
        const unresolved = res.data.checklist.filter((c) => needsAttention(c.status));
        setMsg(
          unresolved.length
            ? `${unresolved.length} item(s) still need attention. You may still download the packet — status is readiness, not approval.`
            : "All checklist items are present. Download when ready.",
        );
      } else if (res.status === "error") {
        setMsg(res.error ?? "Could not preview packet. Try again.");
      }
    });
  }

  async function handleDelete() {
    start(async () => {
      const res = await deletePacket();
      if (res.status === "success") {
        setPacket(null);
        setMsg("Packet deleted. No packet copy is retained in this session.");
      } else if (res.status === "error") {
        setMsg(res.error ?? "Could not delete packet.");
      }
    });
  }

  function download() {
    if (!packet) return;
    const blob = new Blob([JSON.stringify(packet, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "realdoor-readiness-packet.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  const gapItems = packet?.checklist.filter((c) => needsAttention(c.status));

  return (
    <div>
      <h1>Prepare your packet</h1>
      <p className="notice">
        <span className="badge info">Pilot</span> We check your confirmed profile against a document
        list and flag what is missing, outdated, present, or needs review. That is{" "}
        <strong>readiness</strong>, not approval. You preview, download, and delete — nothing is
        sent for you.
      </p>
      <p className="notice">You confirm. A qualified human decides.</p>

      <div className="card">
        <button className="btn" onClick={handlePreview} disabled={pending}>
          Preview packet
        </button>{" "}
        {packet && (
          <>
            <button className="btn secondary" onClick={download} disabled={pending}>
              Download packet (JSON)
            </button>{" "}
            <button className="btn danger" onClick={handleDelete} disabled={pending}>
              Delete packet
            </button>
          </>
        )}
      </div>

      {msg && <p role="status">{msg}</p>}

      {packet && (
        <div className="card">
          <h2>Document readiness</h2>
          {gapItems && gapItems.length > 0 && (
            <p className="error" role="status">
              Needs review (export allowed):{" "}
              {gapItems.map((g) => `${g.label} [${g.status}]`).join(", ")}
            </p>
          )}
          <ul className="plain">
            {packet.checklist.map((c) => (
              <li key={c.id}>
                <strong>{c.label}</strong>{" "}
                <span className={`badge ${statusBadgeClass(c.status)}`}>{c.status}</span>
                <div className="notice">{c.detail}</div>
              </li>
            ))}
          </ul>

          <h2>Confirmed inputs</h2>
          <ul className="plain">
            {packet.fields.map((f) => (
              <li key={f.key}>
                <strong>{f.key}</strong>: {f.rawValue} <span className="badge info">{f.state}</span>
              </li>
            ))}
          </ul>

          <p className="evidence">{packet.readinessNote}</p>
        </div>
      )}
    </div>
  );
}
