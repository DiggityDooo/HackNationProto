// RealDoor frozen contract mirror.
//
// Mirrors shared/realdoor-contract.json from the canonical repo
// (DiggityDooo/HackNationProto, branch lovable/realdoor-ui). When the
// upstream JSON changes, resync every literal here — do NOT invent values.
//
// Fetch URL:
//   https://raw.githubusercontent.com/DiggityDooo/HackNationProto/lovable/realdoor-ui/shared/realdoor-contract.json

export const CONTRACT_VERSION = "1.0.0";
export const CONTRACT_UPDATED_AT = "2026-07-19";

export const CONTRACT = {
  version: CONTRACT_VERSION,
  updatedAt: CONTRACT_UPDATED_AT,
  frozenContext: {
    geography: "Boston-Cambridge-Quincy, MA-NH HMFA",
    geographyHudLabel: "Boston-Cambridge-Quincy, MA-NH HUD Metro FMR Area",
    metroLabel: "Boston–Cambridge–Quincy, MA-NH",
    program: "LIHTC",
    ruleYear: "FY2026",
    effectiveDate: "2026-05-01",
    simulationDate: "2026-07-18",
    evidenceCurrencyDays: 60,
    amiThresholdDefault: 60,
    sourceUrl: "https://www.huduser.gov/portal/datasets/mtsp.html",
    sourceRelease: "FY2026 MTSP Income Limits (frozen)",
    datasetAsOf: "2026-05-01",
    starterPackCsv:
      "realdoor-hackathon-starter-pack/data/mtsp_2026_boston_cambridge_quincy.csv",
  },
  // Frozen MTSP annual USD limits, household sizes 1..8. Contract only
  // freezes the 50% and 60% bands; other bands are intentionally absent.
  mtspLimitsAnnualUsd: {
    1: { 50: 60_000, 60: 72_000 },
    2: { 50: 68_600, 60: 82_320 },
    3: { 50: 77_150, 60: 92_580 },
    4: { 50: 85_700, 60: 102_840 },
    5: { 50: 92_600, 60: 111_120 },
    6: { 50: 99_450, 60: 119_340 },
    7: { 50: 106_300, 60: 127_560 },
    8: { 50: 113_150, 60: 135_780 },
  } as const,
  demoScenarios: [
    { id: "HH-003", label: "Avery Moss", role: "default" },
    { id: "HH-005", label: "Tess Alder", role: "expired-evidence" },
    { id: "HH-002", label: "Jonas Vale", role: "injection-attempt" },
  ] as const,
  stages: ["discover", "profile", "understand", "prepare"] as const,
  fieldAllowlistOrganizer: [
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
  ] as const,
  fieldAllowlistLegacyNext: [
    "applicantName",
    "householdSize",
    "annualIncome",
    "incomeSource",
    "programName",
    "documentDate",
    "employerOrIssuer",
    "propertyName",
  ] as const,
  fieldMappingLegacyToOrganizer: {
    applicantName: "employee",
    employerOrIssuer: "employer",
    annualIncome: "annualized",
    documentDate: "pay_period_end",
  } as const,
  safety: {
    neverOutput: [
      "eligible",
      "approved",
      "denied",
      "qualified",
      "rejected",
      "score",
      "rank",
    ] as const,
    persistentNotices: [
      "Prototype: use synthetic documents only.",
      "You confirm. A qualified human decides.",
    ] as const,
    contextBadge: "Boston pilot | FY 2026 rules",
    copilotName: "RealDoor Guide",
    copilotMode: "read-only",
    avatarAsset:
      "AI 3D avatar/Meshy_AI_The_Architect_Cyberpu_0719020306_image-to-3d-texture.glb",
  },
  citation:
    "HUD FY2026 MTSP Income Limits — Boston-Cambridge-Quincy, MA-NH HUD Metro FMR Area. Effective 2026-05-01. Published by HUD PD&R.",
} as const;

export type Stage = (typeof CONTRACT.stages)[number];
export type AmiBandFrozen = 50 | 60;
export type FrozenHouseholdSize = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export function isFrozenHouseholdSize(n: number): n is FrozenHouseholdSize {
  return Number.isInteger(n) && n >= 1 && n <= 8;
}

/** Returns the frozen MTSP limit, or null if the household size is outside
 *  the frozen 1–8 table. Callers MUST abstain in the null case — never
 *  extrapolate a threshold. */
export function frozenMtspLimit(
  householdSize: number,
  band: AmiBandFrozen = 60,
): number | null {
  if (!isFrozenHouseholdSize(householdSize)) return null;
  return CONTRACT.mtspLimitsAnnualUsd[householdSize][band];
}

/** Convenience alias used by the UI: 60% band lookup with abstention on
 *  out-of-range sizes. */
export function amiLimit60(householdSize: number): number | null {
  return frozenMtspLimit(householdSize, 60);
}
