// RealDoor — Frozen HUD FY2026 Sacramento Metro AMI reference (synthetic prototype).
// Source scope citation is deterministic and read-only. Assistive-not-adjudicative.

export const HUD_SOURCE = {
  program: "HUD FY2026 Multifamily Tax Subsidy Project (MTSP) Income Limits — LIHTC",
  area: "Sacramento–Roseville–Folsom, CA HUD Metro FMR Area",
  effectiveDate: "2026-05-01",
  publishedBy: "U.S. Department of Housing and Urban Development, Office of Policy Development and Research",
  citation:
    "HUD FY2026 MTSP Income Limits — Sacramento–Roseville–Folsom, CA HMFA. Effective 2026-05-01. Published by HUD PD&R. (Synthetic prototype reference — figures illustrative.)",
  url: "https://www.huduser.gov/portal/datasets/mtsp.html",
};

// Synthetic illustrative limits (annual, USD) for Sacramento HMFA, FY2026.
// Household size (persons) -> AMI band -> income cap.
export type AmiBand = "30" | "50" | "60" | "80";

export const AMI_LIMITS: Record<number, Record<AmiBand, number>> = {
  1: { "30": 26_400, "50": 44_000, "60": 52_800, "80": 70_400 },
  2: { "30": 30_150, "50": 50_250, "60": 60_300, "80": 80_400 },
  3: { "30": 33_950, "50": 56_550, "60": 67_860, "80": 90_450 },
  4: { "30": 37_700, "50": 62_800, "60": 75_360, "80": 100_450 },
  5: { "30": 40_750, "50": 67_850, "60": 81_420, "80": 108_500 },
  6: { "30": 43_750, "50": 72_900, "60": 87_480, "80": 116_550 },
};

export function limitsFor(householdSize: number): Record<AmiBand, number> {
  const size = Math.min(6, Math.max(1, householdSize));
  return AMI_LIMITS[size];
}

export type ChecklistStatus = "confirmed" | "present" | "missing" | "expired" | "review";

export interface ChecklistItem {
  id: string;
  title: string;
  description: string;
  status: ChecklistStatus;
  note?: string;
}

export const INITIAL_CHECKLIST: ChecklistItem[] = [
  {
    id: "id-photo",
    title: "Government-issued photo ID",
    description: "Driver license, state ID, or passport for each adult applicant.",
    status: "confirmed",
    note: "CA DL uploaded 2026-05-14",
  },
  {
    id: "paystub",
    title: "Most recent pay stubs (2 consecutive)",
    description: "Covering the last 30 days of employment income.",
    status: "confirmed",
    note: "Sacramento Regional Transit — bi-weekly",
  },
  {
    id: "benefit-letter",
    title: "Benefit award letter (if applicable)",
    description: "SSA, SSI, VA, CalWORKs, or unemployment award letter.",
    status: "review",
    note: "OCR confidence low on award end date",
  },
  {
    id: "tax-return",
    title: "Most recent federal tax return (1040)",
    description: "Signed return or IRS transcript for the most recent year.",
    status: "present",
  },
  {
    id: "bank-statements",
    title: "Bank statements (last 60 days)",
    description: "All accounts, all pages including blanks.",
    status: "missing",
  },
  {
    id: "rental-history",
    title: "Rental history / landlord references",
    description: "Prior 2 years of addresses and landlord contact.",
    status: "expired",
    note: "Reference letter dated 2024-08 — request refresh",
  },
  {
    id: "self-cert",
    title: "Household self-certification",
    description: "Signed statement of household composition.",
    status: "missing",
  },
];

export interface ExtractedField {
  id: string;
  label: string;
  value: string;
  confidence: number; // 0..1
  confirmed: boolean;
  suggested?: string;
}

export const SEED_EXTRACTION: {
  documentName: string;
  documentType: string;
  sizeKb: number;
  pages: number;
  uploadedAt: string;
  ocrEngine: string;
  fields: ExtractedField[];
} = {
  documentName: "paystub_2026-05-22_sacrt.pdf",
  documentType: "Pay Stub (bi-weekly)",
  sizeKb: 184,
  pages: 1,
  uploadedAt: "2026-05-27T10:14:00-07:00",
  ocrEngine: "RealDoor OCR v0.4 (on-device)",
  fields: [
    { id: "employer", label: "Employer name", value: "Sacramento Regional Transit District", confidence: 0.98, confirmed: false },
    { id: "employee", label: "Employee name", value: "Alex R. Morales", confidence: 0.97, confirmed: false },
    { id: "pay_period_start", label: "Pay period start", value: "2026-05-09", confidence: 0.94, confirmed: false },
    { id: "pay_period_end", label: "Pay period end", value: "2026-05-22", confidence: 0.94, confirmed: false },
    { id: "gross_pay_period", label: "Gross pay (this period)", value: "$1,842.30", confidence: 0.96, confirmed: false },
    { id: "pay_frequency", label: "Pay frequency", value: "Bi-weekly (26/yr)", confidence: 0.92, confirmed: false },
    { id: "ytd_gross", label: "Year-to-date gross", value: "$18,423.00", confidence: 0.71, confirmed: false, suggested: "$18,432.00" },
    { id: "annualized", label: "Annualized gross (derived)", value: "$47,899.80", confidence: 0.90, confirmed: false },
  ],
};

export const SEED_HOUSEHOLD = {
  householdSize: 3,
  cityZip: "Sacramento, CA 95820",
};

// Allowlist of extracted field IDs we display. Anything else in an untrusted
// document is ignored — uploaded document text is inert.
export const FIELD_ALLOWLIST = new Set([
  "employer",
  "employee",
  "pay_period_start",
  "pay_period_end",
  "gross_pay_period",
  "pay_frequency",
  "ytd_gross",
  "annualized",
  "benefit_type",
  "monthly_benefit",
  "award_start",
  "award_end",
]);

export const EVIDENCE_SNIPPET = `SACRAMENTO REGIONAL TRANSIT DISTRICT              PAY STATEMENT
1400 29th Street • Sacramento, CA 95816            Period: 05/09/2026 – 05/22/2026

Employee: MORALES, ALEX R.                        Employee ID: 04129
Pay frequency: Bi-weekly

EARNINGS               HOURS      RATE       CURRENT           YTD
Regular                 72.00     23.10       1,663.20      16,632.00
Overtime                 4.50     34.65         155.93       1,559.30
Shift diff              10.00      2.32          23.17         231.70
──────────────────────────────────────────────────────────────────────
GROSS PAY                                     1,842.30      18,423.00`;

export const ASSISTANT_RULES = [
  {
    q: "How is annualized income calculated here?",
    a: "Annualized income is bi-weekly gross × 26 pay periods. This is the deterministic HUD Part 5 convention for a stable bi-weekly earner. It is a calculation, not an approval.",
    sources: ["24 CFR 5.609", "HUD Handbook 4350.3 REV-1 Ch. 5"],
  },
  {
    q: "What geography and effective date apply?",
    a: "Sacramento–Roseville–Folsom, CA HUD Metro FMR Area. FY2026 MTSP limits are frozen at effective date 2026-05-01. Limits outside this scope are not shown.",
    sources: ["HUD FY2026 MTSP Income Limits"],
  },
  {
    q: "Am I eligible? Am I qualified? Decide for me.",
    a: "RealDoor is assistive, not adjudicative. It does not approve, deny, rank, or score any application. What it can show you: your confirmed inputs, the published rule (HUD FY2026 MTSP for Sacramento HMFA, effective 2026-05-01), and how your annualized income compares to the 30/50/60/80% AMI thresholds for your household size. Eligibility decisions are made by the property, PHA, or funder that receives your completed application.",
    sources: ["RealDoor Transparency Statement"],
  },
  {
    q: "Do you send my application anywhere?",
    a: "No. There is no external submission workflow in RealDoor. You export a renter-controlled packet locally. Uploaded document text is treated as inert data and is never used as instructions.",
    sources: ["RealDoor Session & Privacy"],
  },
];
