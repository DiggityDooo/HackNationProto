"""Standard MTSP ingestion (primary source for default LIHTC eligibility).

Two outputs:
  1. mtsp_standard_2026_filtered.json  -> long-format audit extract (parity
     with the IA path in pandareadexcel.py)
  2. ../data/mtsp-fy2026.json          -> the nested fixture the Next.js app
     actually reads via lib/corpus/loader.ts

Keep both paths:
  - pandareadexcel.py       -> IA data, for income-averaging set-asides
  - pandareadexcel_mtsp.py  -> standard MTSP, the DEFAULT eligibility source

GEOGRAPHY KEY (confirmed from loader.ts): the app does `limits[geography]`
where `geography` is the EXACT string in data/config.json -> "geography".
No normalization, no fallback. We key on hud_area_name and you must set
config.geography to a matching hud_area_name (see the printout at the end).
"""
import json
import re
from pathlib import Path

import pandas as pd

HERE = Path(__file__).parent
DATA_DIR = HERE.parent / "data"

# The file you named has a space in it; accept the common variants so this
# runs whether HUD's export keeps or strips the space.
CANDIDATE_NAMES = [
    "FY 2026_MTSP_Income_Limits.xlsx",
    "FY2026_MTSP_Income_Limits.xlsx",
    "MTSP2026.xlsx",
]

# loader.ts pins the AMI schema to exactly these bands; anything else throws
# on mtspSchema.parse(). Emit only these into the app fixture.
ENUM_BANDS = {"30", "50", "60", "80"}

# Must match what lib/corpus/loader.ts reads (mtspSchema.meta requires both).
EFFECTIVE_DATE = "2026-05-01"
SOURCE_URL = "https://www.huduser.gov/portal/datasets/mtsp.html"
GEO_KEY_FIELD = "hud_area_name"  # human-readable; must equal config.geography


def resolve_input() -> Path:
    for name in CANDIDATE_NAMES:
        p = HERE / name
        if p.exists():
            return p
    # Fall back to any xlsx that looks like a standard (non-IA) MTSP export.
    for p in sorted(HERE.glob("*MTSP*.xlsx")):
        if "IncAvg" not in p.name and "IA" not in p.name:
            return p
    raise FileNotFoundError(
        "Standard MTSP file not found. Drop one of these into Exceldatapy/: "
        + ", ".join(CANDIDATE_NAMES)
    )


input_path = resolve_input()
df = pd.read_excel(input_path)

# Normalize column casing once, up front, to avoid lim50 vs Lim60 bugs
df.columns = [c.lower() for c in df.columns]

if GEO_KEY_FIELD not in df.columns:
    raise KeyError(
        f"Expected geography column '{GEO_KEY_FIELD}' not found. "
        f"Available: {sorted(df.columns)[:20]}..."
    )

# Standard file has no _ia suffix. 4 bands (30/50/60/80) x 8 sizes = 32 cols.
limit_col_pattern = re.compile(r"^lim(\d+)_26p(\d)$")
limit_cols = [c for c in df.columns if limit_col_pattern.match(c)]
geo_cols = [c for c in df.columns if c not in limit_cols]

print(f"Reading {input_path.name}")
print(f"Detected {len(limit_cols)} limit columns (expect 32), {len(geo_cols)} geo columns.")

# Warn on AMI-band drift so the parse doesn't fail silently downstream.
file_bands = {limit_col_pattern.match(c).group(1) for c in limit_cols}
unexpected = file_bands - ENUM_BANDS
missing = ENUM_BANDS - file_bands
if unexpected:
    print(f"Note: dropping bands not in loader enum {sorted(ENUM_BANDS)}: {sorted(unexpected)}")
if missing:
    print(f"Warning: loader expects bands {sorted(missing)} that are absent from this file.")

# ---- Output 1: long-format audit extract (unfiltered, all geographies) ----
long_rows = []
for _, row in df.iterrows():
    base = {g: row[g] for g in geo_cols}
    for col in limit_cols:
        m = limit_col_pattern.match(col)
        ami_pct, hh_size = m.group(1), int(m.group(2))
        long_rows.append(
            {
                **base,
                "ami_pct": int(ami_pct),
                "income_averaging": False,
                "household_size": hh_size,
                "income_limit": row[col],
            }
        )

long_df = pd.DataFrame(long_rows)
audit = {
    "metadata": {
        "program": "LIHTC",
        "limit_type": "MTSP",
        "dataset": "Standard MTSP",
        "is_default_source": True,
        "rule_year": 2026,
        "effective_date": EFFECTIVE_DATE,
        "source_file": input_path.name,
    },
    "records": long_df.to_dict(orient="records"),
}
with open(HERE / "mtsp_standard_2026_filtered.json", "w") as f:
    json.dump(audit, f, indent=2)
print(f"Wrote audit extract: mtsp_standard_2026_filtered.json ({len(long_df)} rows).")

# ---- Output 2: nested app fixture the loader reads ------------------------
# Shape (from mtspSchema): { meta:{effectiveDate,sourceUrl,...},
#   limits: { <geography>: { <hhSize>: { "30"|"50"|"60"|"80": number } } } }
limits: dict = {}
for _, row in df.iterrows():
    geo_key = str(row[GEO_KEY_FIELD]).strip()
    if not geo_key or geo_key.lower() == "nan":
        continue
    bucket = limits.setdefault(geo_key, {})
    for col in limit_cols:
        m = limit_col_pattern.match(col)
        ami_pct, hh_size = m.group(1), m.group(2)
        if ami_pct not in ENUM_BANDS:
            continue  # keep parse-safe
        val = row[col]
        if pd.isna(val):
            continue
        bucket.setdefault(hh_size, {})[ami_pct] = int(val)

# ---- Income-averaging merge: bring in the 30% and 80% bands ----------------
# The standard file only carries 50/60. The IA export carries imputed bands
# (20/30/40/50/60/70/80) via `_ia` columns; we take ONLY 30 and 80 to satisfy
# the mtspSchema enum ("30","50","60","80") without leaking 20/40/70. The 50/60
# keys already sourced from the standard file must NOT be overwritten.
IA_INPUT_NAMES = [
    "MTSP-IncAvg-Data-FY26.xlsx",
    "MTSP-IncAvg-Data-FY 26.xlsx",
]
ia_path = None
for name in IA_INPUT_NAMES:
    p = HERE / name
    if p.exists():
        ia_path = p
        break
if ia_path is None:
    for p in sorted(HERE.glob("*IncAvg*.xlsx")):
        ia_path = p
        break

IA_BANDS = {"30", "80"}
ia_limit_col_pattern = re.compile(r"^lim(\d+)_ia_26p(\d)$")
if ia_path is not None:
    ia_df = pd.read_excel(ia_path)
    ia_df.columns = [c.lower() for c in ia_df.columns]
    if GEO_KEY_FIELD not in ia_df.columns:
        print(
            f"Warning: IA file {ia_path.name} missing '{GEO_KEY_FIELD}'; "
            "skipping 30/80 merge."
        )
    else:
        ia_limit_cols = [c for c in ia_df.columns if ia_limit_col_pattern.match(c)]
        ia_bands_present = {
            ia_limit_col_pattern.match(c).group(1) for c in ia_limit_cols
        }
        ia_geo_set = {
            str(v).strip() for v in ia_df[GEO_KEY_FIELD] if str(v).strip().lower() != "nan"
        }
        wanted = IA_BANDS & ia_bands_present
        absent_bands = IA_BANDS - ia_bands_present
        if absent_bands:
            print(
                f"Note: IA file lacks requested band(s) {sorted(absent_bands)}; "
                "those will be absent for affected geographies."
            )

        print(f"Merging IA bands {sorted(wanted)} from {ia_path.name}.")
        missing_geos = []
        for _, row in ia_df.iterrows():
            geo_key = str(row[GEO_KEY_FIELD]).strip()
            if not geo_key or geo_key.lower() == "nan":
                continue
            bucket = limits.get(geo_key)
            if bucket is None:
                # Geography from standard file is authoritative; IA-only geos
                # are not part of the standard fixture.
                continue
            for col in ia_limit_cols:
                m = ia_limit_col_pattern.match(col)
                ami_pct, hh_size = m.group(1), m.group(2)
                if ami_pct not in wanted:
                    continue
                val = row[col]
                if pd.isna(val):
                    continue
                # Do not clobber an existing 50/60 key (none should exist here,
                # but guard anyway); 30/80 come exclusively from the IA file.
                if ami_pct in bucket.get(hh_size, {}):
                    continue
                bucket.setdefault(hh_size, {})[ami_pct] = int(val)

        # Warn for any standard geography missing the IA 30/80 bands.
        for geo_key, bucket in limits.items():
            for band in sorted(wanted):
                have = any(
                    band in hh for hh in bucket.values()
                )
                if not have:
                    missing_geos.append((geo_key, band))
        if missing_geos:
            print(
                f"Warning: {len(missing_geos)} (geography, band) pairs are absent "
                "from the IA file (engine will return null for these):"
            )
            for geo_key, band in missing_geos[:20]:
                print(f"  - {band}% missing for {geo_key!r}")
            if len(missing_geos) > 20:
                print(f"  ... and {len(missing_geos) - 20} more.")
else:
    print("Note: IA source file not found; fixture will carry only 50/60 bands.")

fixture = {
    "meta": {
        "effectiveDate": EFFECTIVE_DATE,
        "sourceUrl": SOURCE_URL,
        "program": "LIHTC",
        "ruleYear": "FY2026",
        "dataset": "Standard MTSP",
        "datasetAsOf": EFFECTIVE_DATE,
        "sourceFile": input_path.name,
        "note": "Standard MTSP fixture keyed by hud_area_name. "
        "Set data/config.json 'geography' to a key present here.",
        "bandSources": {
            "50": "standard MTSP",
            "60": "standard MTSP",
            "30": "IA imputed",
            "80": "IA imputed",
        },
        "iaSourceFile": (
            ia_path.name if ia_path is not None else None
        ),
    },
    "limits": limits,
}
DATA_DIR.mkdir(exist_ok=True)
with open(DATA_DIR / "mtsp-fy2026.json", "w") as f:
    json.dump(fixture, f, indent=2)
print(f"Wrote app fixture: data/mtsp-fy2026.json ({len(limits)} geographies).")

# The lookup is exact-match with no fallback, so surface the keys to wire up.
sample_keys = sorted(limits.keys())[:5]
print("\nACTION REQUIRED: set data/config.json 'geography' to one of these exact keys:")
for k in sample_keys:
    print(f"  - {k!r}")
if len(limits) > len(sample_keys):
    print(f"  ... and {len(limits) - len(sample_keys)} more.")
