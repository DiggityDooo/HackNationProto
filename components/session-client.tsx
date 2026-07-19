"use client";

import { useState, useTransition } from "react";
import { deleteSession, exportSession } from "@/app/actions";

export function SessionClient() {
  const [exported, setExported] = useState<string | null>(null);
  const [deleted, setDeleted] = useState(false);
  const [pending, start] = useTransition();

  async function handleExport() {
    start(async () => {
      const res = await exportSession();
      if (res.status === "success") setExported(JSON.stringify(res.data, null, 2));
    });
  }

  async function handleDelete() {
    if (!confirm("Delete this session and ALL stored data? This cannot be undone.")) return;
    start(async () => {
      const res = await deleteSession();
      if (res.status === "success") {
        setDeleted(true);
        // Keep the pre-deletion snapshot so the renter can prove prior state.
        setExported(JSON.stringify(res.data.snapshotBeforeDeletion, null, 2));
      }
    });
  }

  if (deleted) {
    return (
      <div>
        <h1>Session deleted</h1>
        <p role="status" className="notice">
          All stored data for this session has been removed from storage. Below is
          the export captured before deletion, proving the prior state.
        </p>
        {exported && <pre className="evidence">{exported}</pre>}
      </div>
    );
  }

  return (
    <div>
      <h1>Your session &amp; data</h1>
      <p className="notice">
        You control your data. Export it any time, or hard-delete the session to
        remove all stored fields, rule results, audit log, and packet.
      </p>
      <div className="card">
        <button className="btn secondary" onClick={handleExport} disabled={pending}>
          Export my data
        </button>{" "}
        <button className="btn danger" onClick={handleDelete} disabled={pending}>
          Delete session &amp; all data
        </button>
      </div>
      {exported && (
        <div className="card">
          <h2>Exported data (JSON)</h2>
          <pre className="evidence">{exported}</pre>
        </div>
      )}
    </div>
  );
}
