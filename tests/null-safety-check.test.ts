import { describe, it, expect } from "vitest";
import { loadMtsp } from "@/lib/corpus/loader";
import { compareIncomeToLimit } from "@/lib/rules";
import { DEMO_CONFIG } from "@/data/config";

// The regenerated FY2026 fixture ended up with complete 30/50/60/80 coverage
// for every geography (no IA-merge gaps survived), so there is no real
// missing-band geography to probe. We still verify the loader's null-safety
// contract on the paths that DO return null: an unknown geography and an
// absent household size. A null lookup must surface as a null (never a throw),
// and the engine must report "No frozen MTSP limit" rather than crashing.
describe("MTSP loader null-safety", () => {
  const table = loadMtsp();

  it("returns null for an unknown geography and unknown size (no throw)", () => {
    expect(table.get("Nowhere, ZZ MSA", 4, 60)).toBeNull();
    expect(table.get(DEMO_CONFIG.geography, 99, 60)).toBeNull();
    // a present geography/size/band still resolves
    expect(table.get(DEMO_CONFIG.geography, 4, 60)).toBe(78840);
  });

  it("engine reports 'No frozen MTSP limit' rather than throwing on a null lookup", () => {
    const cfgMissing = { ...DEMO_CONFIG, geography: "Nowhere, ZZ MSA" };
    const out = compareIncomeToLimit(table, cfgMissing, { householdSize: 4, annualIncome: 48000 });
    expect(out.ok).toBe(false);
    if (!out.ok) expect(out.reason).toMatch(/No frozen MTSP limit/i);
  });
});
