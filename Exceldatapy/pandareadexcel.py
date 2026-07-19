import json
import re

import pandas as pd

df = pd.read_excel("MTSP-IncAvg-Data-FY26.xlsx")

# Normalize column casing once, up front, to avoid lim50 vs Lim60 bugs
df.columns = [c.lower() for c in df.columns]

# Filter to target geography
target_state = "CA"
target_county = "Sacramento"

mask = (df["stusps"].str.upper() == target_state) & (
    df["county_town_name"].astype(str).str.contains(target_county, case=False, na=False)
)
filtered = df[mask].copy()

if filtered.empty:
    print(
        "No match — try county_town_name or hud_area_name; "
        "'county' is a numeric FIPS code in this file, not a name."
    )

# Identify limit columns programmatically (7 AMI bands x 8 household sizes)
limit_col_pattern = re.compile(r"^lim(\d+)(_ia)?_26p(\d)$")
limit_cols = [c for c in df.columns if limit_col_pattern.match(c)]
geo_cols = [c for c in df.columns if c not in limit_cols]

print(f"Detected {len(limit_cols)} limit columns, {len(geo_cols)} geo columns.")

# Reshape to long format: one row per (geography, AMI band, household size)
long_rows = []
for _, row in filtered.iterrows():
    base = {g: row[g] for g in geo_cols}
    for col in limit_cols:
        m = limit_col_pattern.match(col)
        ami_band, is_ia, hh_size = m.group(1), bool(m.group(2)), int(m.group(3))
        long_rows.append(
            {
                **base,
                "ami_pct": int(ami_band),
                "income_averaging": is_ia,
                "household_size": hh_size,
                "income_limit": row[col],
            }
        )

long_df = pd.DataFrame(long_rows)

metadata = {
    "program": "LIHTC",
    "limit_type": "MTSP",
    "dataset": "Income Averaging (IA)",
    "rule_year": 2026,
    "effective_date": "2026-05-01",
    "source_file": "MTSP-IncAvg-Data-FY26.xlsx",
}

output = {"metadata": metadata, "records": long_df.to_dict(orient="records")}

with open("mtsp_ia_2026_filtered.json", "w") as f:
    json.dump(output, f, indent=2)

print(f"Exported {len(long_df)} rows (long format) with metadata.")
