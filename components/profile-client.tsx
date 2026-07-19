"use client";

import { useState, useTransition } from "react";
import { confirmField, extractDocument } from "@/app/actions";
import type { ProfileField } from "@/lib/types";
import { STATE_LABELS, STATUS_GLYPH } from "@/lib/provenance";

export function ProfileClient({ initialFields }: { initialFields: ProfileField[] }) {
  const [fields, setFields] = useState<ProfileField[]>(initialFields);
  const [docId, setDocId] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();

  async function handleExtract() {
    if (!docId) return;
    start(async () => {
      const res = await extractDocument(docId);
      if (res.status === "error") {
        setMsg(res.error);
        return;
      }
      setFields(res.data.fields as ProfileField[]);
      setMsg(
        res.data.injectionDetected
          ? "Extraction complete. Note: the document contained embedded instructions, which were treated as inert data and did not change anything."
          : "Extraction complete.",
      );
    });
  }

  async function handleConfirm(f: ProfileField) {
    start(async () => {
      const res = await confirmField(f.key, f.rawValue, false);
      if (res.status === "success") {
        setFields((prev) =>
          prev.map((x) => (x.key === f.key ? { ...x, state: res.data.state } : x)),
        );
      }
    });
  }

  async function handleCorrect(f: ProfileField, value: string) {
    start(async () => {
      const res = await confirmField(f.key, value, true);
      if (res.status === "success") {
        setFields((prev) =>
          prev.map((x) => (x.key === f.key ? { ...x, rawValue: value, state: res.data.state } : x)),
        );
      }
    });
  }

  const confirmedCount = fields.filter(
    (f) => f.state === "confirmed" || f.state === "corrected",
  ).length;

  return (
    <div>
      <h1>Profile</h1>
      <p className="notice">
        Upload a synthetic document below. We extract only an allowlisted set of
        fields and show the exact source text (evidence box) for each. You must
        confirm or correct every value before it is used downstream.
      </p>

      <div className="card">
        <label className="label" htmlFor="doc">Choose a synthetic document</label>
        <input
          id="doc"
          className="input"
          placeholder="e.g. doc-paystub-001"
          value={docId}
          onChange={(e) => setDocId(e.target.value)}
        />
        <p style={{ marginTop: "0.5rem" }}>
          <button className="btn" onClick={handleExtract} disabled={pending || !docId}>
            Extract fields
          </button>
        </p>
      </div>

      {msg && <p role="status">{msg}</p>}

      {fields.length === 0 ? (
        <p className="notice">No fields extracted yet.</p>
      ) : (
        <ul className="plain">
          {fields.map((f) => (
            <li key={f.key} className="card">
              <strong>{f.key}</strong>{" "}
              <span className={`badge ${badgeClass(f.state)}`}>
                {STATUS_GLYPH[f.state]} {STATE_LABELS[f.state]}
              </span>
              <div style={{ marginTop: "0.5rem" }}>
                <label className="label" htmlFor={`val-${f.key}`}>Value</label>
                <input
                  id={`val-${f.key}`}
                  className="input"
                  defaultValue={f.rawValue}
                  onBlur={(e) => {
                    if (e.target.value !== f.rawValue) handleCorrect(f, e.target.value);
                  }}
                />
              </div>
              <p className="evidence">{f.evidenceBox}</p>
              <p className="notice">
                Confidence: {(f.confidence * 100).toFixed(0)}% · Source: {f.sourceDocId} ·
                Rule year: {f.ruleYear} · Effective: {f.effectiveDate}
              </p>
              <p>
                <button
                  className="btn secondary"
                  onClick={() => handleConfirm(f)}
                  disabled={pending}
                >
                  Confirm this value
                </button>
              </p>
            </li>
          ))}
        </ul>
      )}

      <p role="status" className="notice" aria-live="polite">
        {confirmedCount} of {fields.length} fields confirmed.
      </p>
    </div>
  );
}

function badgeClass(state: ProfileField["state"]): string {
  switch (state) {
    case "confirmed":
    case "corrected":
      return "ok";
    case "uncertain":
      return "warn";
    default:
      return "info";
  }
}
