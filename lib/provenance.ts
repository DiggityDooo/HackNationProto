import type { FieldState, ProvenanceRecord } from "./types";

// Helpers for constructing provenance records and for the UI to render
// confirmation state consistently (no color-only status signals).

export function defaultProvenance(
  partial: Partial<ProvenanceRecord> & {
    sourceDocId: string;
    sourceUrl?: string;
    sourceFile?: string;
    locator?: string; // Evidence box or text snippet
    confidence?: number;
    state?: FieldState;
    ruleYear?: string;
    effectiveDate?: string;
    geography?: string;
    datasetRelease?: string;
  },
): ProvenanceRecord {
  return {
    evidenceBox: partial.evidenceBox ?? partial.locator ?? "",
    confidence: partial.confidence ?? 0,
    state: partial.state ?? "uncertain",
    ruleYear: (partial.ruleYear as ProvenanceRecord["ruleYear"]) ?? "FY2026",
    effectiveDate: partial.effectiveDate ?? "",
    geography: partial.geography ?? "",
    sourceUrl: partial.sourceUrl ?? "",
    datasetRelease: partial.datasetRelease ?? "",
    sourceDocId: partial.sourceDocId,
  };
}

export const STATE_LABELS: Record<FieldState, string> = {
  extracted: "Extracted — not yet confirmed",
  uncertain: "Uncertain — needs your review",
  confirmed: "Confirmed by you",
  corrected: "Corrected by you",
};

export function stateBadgeText(state: FieldState): string {
  return STATE_LABELS[state];
}

// WCAG: pair every colored status with a visible text/icon label.
export const STATUS_GLYPH: Record<FieldState, string> = {
  extracted: "[!]",
  uncertain: "[?]",
  confirmed: "[✓]",
  corrected: "[✎]",
};

export function createProvenance(
  partial: Partial<ProvenanceRecord> & { sourceDocId: string },
): ProvenanceRecord {
  return defaultProvenance({ state: "uncertain", ...partial });
}