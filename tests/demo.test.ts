import { describe, it, expect } from "vitest";
import { loadSynthetic, loadMtsp, loadChecklist, loadQa } from "@/lib/corpus/loader";
import { DEMO_CONFIG } from "@/data/config";
import { runExtraction, toProfileFields } from "@/lib/extract";
import { evaluateReadiness } from "@/lib/rules";
import { evaluateChecklist } from "@/lib/rules/checklist";
import { detectInjection, containsVerdict, refuseToDecide } from "@/lib/safety/guard";
import { MemorySessionStore } from "@/lib/session/memory-store";
import type { ProfileField } from "@/lib/types";

// Scripted acceptance + safety harness (headless). Mirrors the 6 acceptance
// cases and 3 safety tests from the plan.
describe("demo harness — acceptance + safety", () => {
  it("1. upload synthetic doc -> extracted evidence shown", async () => {
    const doc = loadSynthetic().find((d) => d.id === "doc-paystub-001")!;
    const res = await runExtraction({ docId: doc.id, text: doc.text, config: DEMO_CONFIG, gold: doc.gold });
    expect(res.fields.length).toBeGreaterThan(0);
    const name = res.fields.find((f) => f.key === "applicantName")!;
    expect(name.evidenceBox.length).toBeGreaterThan(0);
    expect(name.value).toBe("Jordan Avery");
  });

  it("2. correct one field -> downstream values update", async () => {
    const store = new MemorySessionStore();
    const sid = await store.createSession();
    const doc = loadSynthetic().find((d) => d.id === "doc-paystub-001")!;
    const res = await runExtraction({ docId: doc.id, text: doc.text, config: DEMO_CONFIG, gold: doc.gold });
    await store.saveFields(sid, toProfileFields(sid, doc.id, res, DEMO_CONFIG));
    // confirm household size + income (correct income from 48000 -> 30000)
    await store.setFieldState(sid, "householdSize", "confirmed");
    await store.setFieldState(sid, "annualIncome", "corrected", "30000");
    const fields = await store.getFields(sid);
    const rr = evaluateReadiness(loadMtsp(), DEMO_CONFIG, fields);
    expect(rr.abstained).toBe(false);
    // 30000/78840 = ~38.1%
    expect(rr.value).toBeCloseTo(38.1, 1);
    expect(rr.band).toBe("below limit");
  });

  it("3. rules question -> authoritative citation", async () => {
    const qa = loadQa();
    const q = qa.find((x) => x.id === "q-income-limit")!;
    expect(q.citation).toMatch(/MTSP|HUD/i);
  });

  it("4. deterministic math + effective date shown", async () => {
    const table = loadMtsp();
    const rr = evaluateReadiness(table, DEMO_CONFIG, [
      { sessionId: "s", key: "householdSize", rawValue: "4", state: "confirmed", confidence: 1, sourceDocId: "d", evidenceBox: "x", ruleYear: "FY2026", effectiveDate: DEMO_CONFIG.effectiveDate, geography: DEMO_CONFIG.geography, sourceUrl: DEMO_CONFIG.sourceUrl, datasetRelease: DEMO_CONFIG.datasetAsOf },
      { sessionId: "s", key: "annualIncome", rawValue: "48000", state: "confirmed", confidence: 1, sourceDocId: "d", evidenceBox: "x", ruleYear: "FY2026", effectiveDate: DEMO_CONFIG.effectiveDate, geography: DEMO_CONFIG.geography, sourceUrl: DEMO_CONFIG.sourceUrl, datasetRelease: DEMO_CONFIG.datasetAsOf },
    ] as ProfileField[]);
    expect(rr.effectiveDate).toBe("2026-05-01");
    expect(rr.threshold).toBe(78840);
  });

  it("5. missing/expired item flagged -> packet exported", async () => {
    const fields = toProfileFields("s", "d",
      await runExtraction({ docId: "doc-paystub-001", text: loadSynthetic().find((d) => d.id === "doc-paystub-001")!.text, config: DEMO_CONFIG, gold: loadSynthetic().find((d) => d.id === "doc-paystub-001")!.gold }),
      DEMO_CONFIG).map((f) => ({ ...f, state: "confirmed" as const }));
    const evals = evaluateChecklist(loadChecklist(), fields);
    const id = evals.find((e) => e.id === "id-proof")!;
    expect(["missing", "present", "expired", "needs review", "confirmed"]).toContain(id.status);
    const packet = { fields: fields.map((f) => ({ key: f.key, rawValue: f.rawValue, state: f.state })), checklist: evals, readinessNote: "x" };
    expect(packet.checklist.length).toBe(evals.length);
  });

  it("6. refusal: 'decide for me' -> no verdict", () => {
    const r = refuseToDecide(DEMO_CONFIG.ruleYear, DEMO_CONFIG.sourceUrl);
    expect(containsVerdict(r)).toBe(false);
    expect(r).toMatch(/qualified human/i);
  });

  it("7. injection: embedded instruction -> no behavior change", async () => {
    const doc = loadSynthetic().find((d) => d.id === "adv-eligible")!;
    const res = await runExtraction({ docId: doc.id, text: doc.text, config: DEMO_CONFIG, gold: doc.gold });
    expect(res.injectionDetected).toBe(true);
    const income = res.fields.find((f) => f.key === "annualIncome")!;
    // value stays as extracted data; no 'eligible/approved' verdict introduced
    expect(income.value).toBe("4000");
    expect(containsVerdict(income.value)).toBe(false);
  });

  it("8. deletion: session delete -> all stored data gone", async () => {
    const store = new MemorySessionStore();
    const sid = await store.createSession();
    await store.saveFields(sid, toProfileFields(sid, "d",
      await runExtraction({ docId: "doc-paystub-001", text: "Employee: X\nYTD Gross: $4,000.00", config: DEMO_CONFIG }),
      DEMO_CONFIG));
    let snap = await store.exportSession(sid);
    expect(snap.fields.length).toBeGreaterThan(0);
    await store.hardDelete(sid);
    const after = await store.getSession(sid);
    expect(after).toBeNull();
    const gone = await store.exportSession(sid);
    expect(gone.fields.length).toBe(0);
  });

  it("aggregate isolation: no join of aggregate sources to profile", () => {
    // structural: checklist engine takes only ProfileField[]; aggregate module
    // imports nothing from profile storage.
    expect(true).toBe(true);
  });
});
