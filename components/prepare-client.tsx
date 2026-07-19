"use client";

import { useState, useTransition } from "react";
import { previewPacket, deletePacket } from "@/app/actions";
import type { PacketPreview } from "@/app/actions";

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

export function PrepareClient() {
  const [packet, setPacket] = useState<PacketPreview | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();

  async function handlePreview() {
    start(async () => {
      const res = await previewPacket();
      if (res.status === "success" && res.data) {
        setPacket(res.data);
        const missing = res.data.checklist.filter(
          (c) => c.status === "missing" || c.status === "expired",
        );
        setMsg(
          missing.length
            ? `${missing.length} item(s) flagged missing or expired. Review your packet.`
            : "All reviewed items present.",
        );
      }
    });
  }

  async function handleDelete() {
    start(async () => {
      const res = await deletePacket();
      if (res.status === "success") {
        setPacket(null);
        setMsg("Packet deleted. No copy is retained on the server.");
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

  const gapItems = packet?.checklist.filter(
    (c) => c.status === "missing" || c.status === "expired",
  );

  return (
    <div>
      <h1>Prepare your packet</h1>
      <p className="notice">
        We compare your confirmed profile to the document checklist and flag what
        is missing, expired, present, or needs review. Status is about
        <strong> readiness</strong>, never approval. The packet is
        <strong> renter-controlled</strong>: you preview, edit, download, and
        delete it. It is never auto-submitted to a property or provider.
      </p>

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
            <p className="error">
              Flagged: {gapItems.map((g) => g.label).join(", ")}
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
                <strong>{f.key}</strong>: {f.rawValue}{" "}
                <span className="badge info">{f.state}</span>
              </li>
            ))}
          </ul>

          <p className="evidence">{packet.readinessNote}</p>
        </div>
      )}
    </div>
  );
}
