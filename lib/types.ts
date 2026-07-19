// Core domain types for RealDoor. These are frozen/shared across the engine,
// persistence, and UI. Everything here is assistive-only metadata — no
// eligibility verdicts are ever represented as data.

export type ProgramId = "LIHTC";

export type RuleYear = "FY2026";

export type FieldState = "extracted" | "uncertain" | "confirmed" | "corrected";

export type ChecklistStatus =
  | "missing"
  | "present"
  | "expired"
  | "needs review"
  | "confirmed";

// AMI threshold we compare household income against (e.g. 60).
export type AmiThreshold = 30 | 50 | 60 | 80;

// Fixed, allowlisted set of profile fields a document may populate.
// Anything outside this set is dropped by the extractor and flagged uncertain.
export const PROFILE_FIELD_KEYS = [
  "applicantName",
  "householdSize",
  "annualIncome",
  "incomeSource",
  "programName",
  "documentDate",
  "employerOrIssuer",
  "propertyName",
] as const;

export type ProfileFieldKey = (typeof PROFILE_FIELD_KEYS)[number];

export interface ProvenanceRecord {
  sourceDocId: string;
  // A locator or quoted "evidence box" tying the value to its source.
  evidenceBox: string;
  confidence: number; // 0..1
  state: FieldState;
  ruleYear: RuleYear;
  effectiveDate: string; // ISO date
  geography: string;
  sourceUrl: string;
  datasetRelease: string; // release/as-of label
}

export interface ProfileField extends ProvenanceRecord {
  sessionId: string;
  key: ProfileFieldKey;
  rawValue: string;
}

// A deterministic rule evaluation result. The LLM never supplies numbers.
export interface RuleResult {
  ruleId: string;
  ruleYear: RuleYear;
  effectiveDate: string;
  geography: string;
  sourceUrl: string;
  citation: string;
  // Human-readable inputs used (from confirmed profile fields).
  inputRefs: Record<string, string>;
  // The frozen threshold value (e.g. 60% AMI limit for N-person household).
  threshold: number;
  formula: string;
  // The computed readiness signal value (e.g. percent of limit).
  value: number;
  // Readiness band — NOT an eligibility decision.
  band: "below limit" | "at or above limit" | "abstained";
  abstained: boolean;
  abstainReason?: string;
}
