"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { confirmField, extractDocument } from "@/app/actions";
import type { ProfileField } from "@/lib/types";
import { STATE_LABELS, STATUS_GLYPH } from "@/lib/provenance";

type DocOption = { id: string; type: string; label: string };

const EXAMPLES: DocOption[] = [
  { id: "doc-paystub-001", type: "pay_stub", label: "Pay stub · Jordan Avery (default)" },
  { id: "doc-benefit-002", type: "benefit_letter", label: "Benefit letter · Sam Rivera" },
  { id: "adv-eligible", type: "pay_stub", label: "Adversarial stub · injection attempt" },
];

function matchFixtureId(fileName: string, docs: DocOption[]): string | null {
  const base = fileName.replace(/\.[^.]+$/, "").toLowerCase();
  const exact = docs.find((d) => d.id.toLowerCase() === base);
  if (exact) return exact.id;
  if (/pay.?stub|jordan|avery|hh-?003/i.test(fileName)) return "doc-paystub-001";
  if (/benefit|rivera|snap|hh-?00[36]/i.test(fileName)) return "doc-benefit-002";
  if (/inject|adversar|eligible|hh-?002/i.test(fileName)) return "adv-eligible";
  return null;
}

export function ProfileClient({
  initialFields,
  initialDocId = "",
  docs = EXAMPLES,
}: {
  initialFields: ProfileField[];
  initialDocId?: string;
  docs?: DocOption[];
}) {
  const [fields, setFields] = useState<ProfileField[]>(initialFields);
  const [docId, setDocId] = useState(initialDocId || "doc-paystub-001");
  const [fileLabel, setFileLabel] = useState<string | null>(null);
  const [syntheticOk, setSyntheticOk] = useState(false);
  const [consentOk, setConsentOk] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const consented = syntheticOk && consentOk;

  useEffect(() => {
    if (initialDocId) setDocId(initialDocId);
  }, [initialDocId]);

  async function runExtract(id: string) {
    if (!consented) {
      setMsg("Both consent confirmations are required before extraction.");
      return;
    }
    if (!id) return;
    start(async () => {
      const res = await extractDocument(id);
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

  function onFileChosen(file: File | undefined) {
    if (!file) return;
    if (!consented) {
      setMsg("Both consent confirmations are required before upload.");
      return;
    }
    const matched = matchFixtureId(file.name, docs);
    setFileLabel(file.name);
    if (matched) {
      setDocId(matched);
      setMsg(`Matched upload “${file.name}” to fixture ${matched}. Extracting…`);
      void runExtract(matched);
      return;
    }
    setMsg(
      `“${file.name}” is accepted as a synthetic upload for this demo. Choose a fixture below that matches the document type, then extract.`,
    );
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
        <span className="badge info">Pilot</span> Consent first, then upload a synthetic document or
        pick an example. We pull only allowed fields and show the exact source text for each.
        Confirm or fix every value before it is used later.
      </p>
      <p className="notice">You confirm. A qualified human decides.</p>

      <div className="card">
        <h2 style={{ marginTop: 0 }}>Consent before you upload</h2>
        <ul className="plain">
          <li>Session is ephemeral. Nothing is submitted for you.</li>
          <li>Uploaded document text is treated as inert data — never as instructions.</li>
          <li>Only an allowlist of fields is extracted. You review and confirm each one.</li>
        </ul>

        <label
          htmlFor="consent-synthetic"
          style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start", marginTop: "1rem" }}
        >
          <input
            id="consent-synthetic"
            type="checkbox"
            checked={syntheticOk}
            onChange={(e) => setSyntheticOk(e.target.checked)}
            style={{ marginTop: "0.25rem" }}
          />
          <span>
            I confirm this is an organizer-provided <strong>synthetic</strong> document and contains
            no real personal data.
          </span>
        </label>

        <label
          htmlFor="consent-process"
          style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start", marginTop: "0.75rem" }}
        >
          <input
            id="consent-process"
            type="checkbox"
            checked={consentOk}
            onChange={(e) => setConsentOk(e.target.checked)}
            style={{ marginTop: "0.25rem" }}
          />
          <span>
            I consent to processing this synthetic document in this ephemeral session for allowlisted
            field extraction. See{" "}
            <Link href="/session">Session</Link> and <Link href="/transparency">Transparency</Link>.
          </span>
        </label>

        <p className="notice" style={{ marginTop: "0.75rem" }}>
          Both confirmations are required before upload.
        </p>

        <div
          style={{
            marginTop: "1rem",
            display: "grid",
            gap: "0.75rem",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          }}
        >
          <label
            className="card"
            style={{
              margin: 0,
              cursor: consented ? "pointer" : "not-allowed",
              opacity: consented ? 1 : 0.55,
            }}
          >
            <strong>Upload synthetic document</strong>
            <div className="notice">PDF, JPG, or PNG · local only · demo maps to fixtures</div>
            <input
              type="file"
              accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/*"
              disabled={!consented || pending}
              onChange={(e) => onFileChosen(e.target.files?.[0])}
              style={{ marginTop: "0.5rem" }}
            />
            {fileLabel && <div className="evidence">Chosen: {fileLabel}</div>}
          </label>

          <div className="card" style={{ margin: 0, opacity: consented ? 1 : 0.55 }}>
            <strong>Try a synthetic example</strong>
            <div className="notice">No file needed — loads a frozen fixture</div>
            <div style={{ marginTop: "0.5rem", display: "flex", flexDirection: "column", gap: "0.4rem" }}>
              {EXAMPLES.map((ex) => (
                <button
                  key={ex.id}
                  type="button"
                  className="btn secondary"
                  disabled={!consented || pending}
                  onClick={() => {
                    setDocId(ex.id);
                    setFileLabel(null);
                    void runExtract(ex.id);
                  }}
                >
                  {ex.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <label className="label" htmlFor="doc">
          Or select fixture ID
        </label>
        <select
          id="doc"
          className="input"
          value={docId}
          disabled={!consented}
          onChange={(e) => setDocId(e.target.value)}
        >
          {docs.map((d) => (
            <option key={d.id} value={d.id}>
              {d.id} ({d.type})
            </option>
          ))}
        </select>
        <p style={{ marginTop: "0.5rem" }}>
          <button
            className="btn"
            onClick={() => void runExtract(docId)}
            disabled={pending || !docId || !consented}
          >
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
            <li key={`${f.sourceDocId}:${f.key}`} className="card">
              <strong>{f.key}</strong>{" "}
              <span className={`badge ${badgeClass(f.state)}`}>
                {STATUS_GLYPH[f.state]} {STATE_LABELS[f.state]}
              </span>
              <div style={{ marginTop: "0.5rem" }}>
                <label className="label" htmlFor={`val-${f.key}`}>
                  Value
                </label>
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
                Confidence: {(f.confidence * 100).toFixed(0)}% · Source: {f.sourceDocId} · Rule
                year: {f.ruleYear} · Effective: {f.effectiveDate}
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
