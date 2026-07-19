# Plan: Wire Standard MTSP (FY2026) as the Default LIHTC Eligibility Source

## Context

RealDoor's eligibility engine (`lib/rules`) looks up income limits through
`lib/corpus/loader.ts` → `data/mtsp-fy2026.json`. Until now that file was a
**Springfield smoke fixture**, so the app couldn't evaluate any real property.

We now have two HUD FY2026 source files in `Exceldatapy/`:

- `MTSP-Data-FY26.xlsx` — **standard MTSP**, carries only 50% and 60% AMI
  (2,635 geographies, keyed by `hud_area_name`). This is the primary source.
- `MTSP-IncAvg-Data-FY26.xlsx` — **income-averaging (IA)** export, carries the
  imputed 20/30/40/50/60/70/80 bands (`_ia` columns) plus base 50/60.

`pandareadexcel_mtsp.py` already ingests the standard file and writes both a
long-format audit extract and the nested app fixture. Two gaps remain:

1. The fixture only has 50/60 — but the demo needs **30% and 80%** too.
2. `config.geography` still points at the retired Springfield key, so lookups
   return `null` until repointed, and the tests hardcode Springfield numbers.

**Decisions locked in with the user:**
- Demo default geography = `Sacramento--Roseville--Arden-Arcade, CA HUD Metro FMR Area`.
- 30%/80% are required. Correct LIHTC source is the **IA file's `_ia` imputed
  bands** (verified: IA base 50/60 == standard 50/60 for Sacramento, so no
  conflict). Section 8 ELI/Low-Income tables are the *wrong* numbers for LIHTC
  and will not be used.

**Intended outcome:** `data/mtsp-fy2026.json` becomes the real Sacramento-anchored
MTSP table with 30/50/60/80 bands, the app evaluates eligibility end-to-end, and
the test suite passes against real numbers.

## Verified reference values (Sacramento, from the fixture / IA extract)

| Household | 50% | 60% |
|-----------|-----|-----|
| 1-person  | 46,000 | 55,200 |
| 4-person  | 65,700 | 78,840 |

(30%/80% for Sacramento to be read from the regenerated fixture after step 2 and
used to update any band-specific assertions — current tests only assert 60%.)

## Steps

### 1. Extend `Exceldatapy/pandareadexcel_mtsp.py` to merge IA 30/80
- After building `limits` from the standard file (50/60), open the IA file
  (`MTSP-IncAvg-Data-FY26.xlsx`) and select columns matching
  `^lim(\d+)_ia_26p(\d)$` where band ∈ {30, 80}.
- Nest by the same `hud_area_name` key into `limits[geo][size]["30"|"80"]`.
- Keep 50/60 from the **standard** file as canonical (do not overwrite from IA).
- Record provenance in `meta`, e.g.
  `"bandSources": {"50":"standard MTSP","60":"standard MTSP","30":"IA imputed","80":"IA imputed"}`
  and `"iaSourceFile": "MTSP-IncAvg-Data-FY26.xlsx"`.
- Leave the enum guard intact (only 30/50/60/80 reach the fixture; 20/40/70 in
  the IA file are skipped — they'd violate `mtspSchema`'s `z.enum`).
- Guard the IA file with the same `resolve_input`-style existence check; warn (do
  not crash) if a geography present in standard lacks IA 30/80.

### 2. Regenerate the fixture
- `/home/seanb/Documents/Hack-Nation/.venv/bin/python Exceldatapy/pandareadexcel_mtsp.py`
- Confirm the printed geography count and that Sacramento now has 30/50/60/80.

### 3. Point the app at Sacramento — `data/config.json`
- `geography` → `"Sacramento--Roseville--Arden-Arcade, CA HUD Metro FMR Area"`
  (exact key; the loader does `limits[geography]` with no normalization/fallback).
- `metro` → readable label, e.g. `"Sacramento–Roseville–Arden-Arcade, CA"`.
- Leave `amiThreshold: 60`, `program`, `ruleYear: "FY2026"`, `effectiveDate`,
  `sourceUrl`, `datasetAsOf`, `sourceRelease` as-is (all still satisfy
  `configSchema` in `lib/corpus/loader.ts`). `DEMO_CONFIG` (`data/config.ts`)
  picks these up automatically — no separate edit.

### 4. Update hardcoded test expectations (Springfield 60,864 → Sacramento 78,840)
`tests/engine.test.ts`:
- "matches frozen MTSP table for 4-person 60% AMI": `toBe(60864)` → `toBe(78840)`.
- "produces a correct readiness percent" (income 48,000, 4-person):
  `out.limit` `60864`→`78840`; `Math.round(out.percentOfLimit)` `79`→`61`
  (48000/78840 = 60.9%); band stays `"below limit"`.
- "flags at-or-above limit correctly": 1-person income `50000`→`60000` (1-person
  60% is now 55,200; 50,000 would flip to "below limit"). Keeps the "at or above
  limit" assertion meaningful.
- "computes when confirmed": `toBeCloseTo(78.9, 1)` → `toBeCloseTo(60.9, 1)`.

`tests/demo.test.ts`:
- Case 2 (income corrected to 30,000, 4-person): comment `30000/60864 ≈ 49.3%`
  → `30000/78840 ≈ 38.1%`; `toBeCloseTo(49.3, 1)` → `toBeCloseTo(38.1, 1)`;
  band stays `"below limit"`.
- Case 4: `expect(rr.threshold).toBe(60864)` → `toBe(78840)`; `effectiveDate`
  assertion `"2026-05-01"` unchanged.

### 5. Reproducibility
- Add `Exceldatapy/requirements.txt` (`pandas`, `openpyxl`) and a one-line run
  note (venv was created as `.venv` with `--system-site-packages`; run scripts
  with `/home/seanb/Documents/Hack-Nation/.venv/bin/python`).
- Ensure `.gitignore` covers `.venv/`. Commit the regenerated
  `data/mtsp-fy2026.json` (1.4 MB) so the app runs without Python.

## Files to modify
- `Exceldatapy/pandareadexcel_mtsp.py` — merge IA 30/80 (step 1)
- `data/mtsp-fy2026.json` — regenerated artifact (step 2)
- `data/config.json` — Sacramento geography/metro (step 3)
- `tests/engine.test.ts`, `tests/demo.test.ts` — real numbers (step 4)
- `Exceldatapy/requirements.txt` (new), `.gitignore` (step 5)

## Reuse / do not duplicate
- Keep `Exceldatapy/pandareadexcel.py` (IA path) untouched — it stays the source
  for IA-scoped set-asides, per the earlier scoping decision.
- Reuse the existing `limit_col_pattern`, `ENUM_BANDS`, `resolve_input`, and
  `hud_area_name` keying already in `pandareadexcel_mtsp.py`; only add the IA
  merge branch.
- No loader/schema change needed: `mtspSchema` already allows `enum(["30","50","60","80"])`.

## Verification
1. **Ingestion:** run step 2; confirm stdout shows 2,635 geographies and no
   "bands absent" warning for 30/80; spot-check Sacramento has all four bands.
2. **Unit/acceptance tests:** `npx vitest run` (config: `vitest.config.ts`,
   `tsconfig.test.json`) — all of `tests/engine.test.ts` and `tests/demo.test.ts`
   green with the new numbers.
3. **App end-to-end:** start the Next.js app (`npm run dev`), drive the
   understand/eligibility flow for a confirmed 4-person / income input, and
   confirm the UI shows the Sacramento 60%-AMI limit (78,840), the effective date
   (2026-05-01), and geography label — and that a "decide for me" prompt still
   refuses (safety guard). Use the `run` skill if a project launch recipe exists.
4. **Null-safety:** confirm a 30% or 80% lookup for a geography that lacks IA
   data returns `null` gracefully (engine reports "No frozen MTSP limit"), not a
   crash.

## Risks / notes
- **Exact-match geography:** any drift between `config.geography` and the fixture
  key silently yields `null`. Both derive from `hud_area_name` — keep them identical.
- **Fixture size:** `loadMtsp()` reads+parses 1.4 MB per server action. Fine for
  the demo; optional follow-up is memoizing `loadMtsp()` or slimming the fixture
  to demo geographies.
- **30/80 semantics:** these are LIHTC *imputed* limits from the IA file, correct
  for eligibility tiers but distinct from Section 8 ELI/Low-Income; provenance is
  recorded in `meta.bandSources` for transparency.
