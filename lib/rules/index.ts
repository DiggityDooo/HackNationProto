import type { DemoConfig } from "@/data/config";
import type { MtspTable } from "../corpus/loader";
import type { ProfileField, RuleResult } from "../types";

export interface CalcInput {
  householdSize: number;
  annualIncome: number;
}

export type CalcOutcome =
  | { ok: true; limit: number; percentOfLimit: number; band: "below limit" | "at or above limit" }
  | { ok: false; reason: string };

// Pure deterministic function over the frozen MTSP table. No LLM input.
export function compareIncomeToLimit(
  table: MtspTable,
  config: DemoConfig,
  input: CalcInput,
): CalcOutcome {
  const limit = table.get(config.geography, input.householdSize, config.amiThreshold);
  if (limit == null) {
    return { ok: false, reason: "No frozen MTSP limit for this geography/size/AMI%." };
  }
  const percentOfLimit = (input.annualIncome / limit) * 100;
  const band = percentOfLimit < 100 ? "below limit" : "at or above limit";
  return { ok: true, limit, percentOfLimit, band };
}

export function buildRuleResult(
  table: MtspTable,
  config: DemoConfig,
  outcome: Extract<CalcOutcome, { ok: true }>,
  inputRefs: Record<string, string>,
): RuleResult {
  return {
    ruleId: "income-vs-ami-limit",
    ruleYear: config.ruleYear,
    effectiveDate: table.effectiveDate,
    geography: config.geography,
    sourceUrl: table.sourceUrl,
    citation: `HUD MTSP Income Limits ${config.ruleYear}, ${config.geography}, effective ${table.effectiveDate}`,
    inputRefs,
    threshold: outcome.limit,
    formula: `annualIncome / (${config.amiThreshold}% AMI limit for ${inputRefs.householdSize}-person household) × 100`,
    value: Math.round(outcome.percentOfLimit * 10) / 10,
    band: outcome.band,
    abstained: false,
  };
}

// Engine entry. Confirms inputs are present & confirmed; otherwise abstains and
// surfaces the provenance gap (no fabricated numbers).
export function evaluateReadiness(
  table: MtspTable,
  config: DemoConfig,
  fields: ProfileField[],
): RuleResult {
  const confirmed = fields.filter(
    (f) => f.state === "confirmed" || f.state === "corrected",
  );
  const sizeField = confirmed.find((f) => f.key === "householdSize");
  const incomeField = confirmed.find((f) => f.key === "annualIncome");

  const abstain = (reason: string): RuleResult => ({
    ruleId: "income-vs-ami-limit",
    ruleYear: config.ruleYear,
    effectiveDate: table.effectiveDate,
    geography: config.geography,
    sourceUrl: table.sourceUrl,
    citation: `HUD MTSP Income Limits ${config.ruleYear}, ${config.geography}`,
    inputRefs: {},
    threshold: 0,
    formula: `annualIncome / (${config.amiThreshold}% AMI limit for household size) × 100`,
    value: 0,
    band: "abstained",
    abstained: true,
    abstainReason: reason,
  });

  if (!sizeField || !incomeField) {
    return abstain(
      "Cannot compute: confirm household size and annual income first.",
    );
  }
  const size = Number(sizeField.rawValue);
  const income = Number(incomeField.rawValue);
  if (!Number.isFinite(size) || !Number.isFinite(income)) {
    return abstain("Confirmed income or household size is not numeric.");
  }
  const outcome = compareIncomeToLimit(table, config, {
    householdSize: size,
    annualIncome: income,
  });
  if (!outcome.ok)   return abstain(outcome.reason);

  return buildRuleResult(table, config, outcome, {
    householdSize: String(size),
    annualIncome: String(income),
  });
}
