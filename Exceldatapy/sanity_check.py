import re

import pandas as pd

df = pd.read_excel("MTSP-IncAvg-Data-FY26.xlsx")
df.columns = [c.lower() for c in df.columns]

limit_col_pattern = re.compile(r"^lim(\d+)(_ia)?_26p(\d)$")
limit_cols = [c for c in df.columns if limit_col_pattern.match(c)]
geo_cols = [c for c in df.columns if c not in limit_cols]

print("=== Column detection ===")
print(f"limit_cols: {len(limit_cols)} (expected 56)")
print(f"geo_cols: {len(geo_cols)}")
if len(limit_cols) != 56:
    missed = [c for c in df.columns if c.startswith("lim") and c not in limit_cols]
    print("Unmatched lim* columns:", missed)

print("\n=== Sacramento geography probes (CA) ===")
ca = df[df["stusps"].str.upper() == "CA"]
print(f"CA rows total: {len(ca)}")

for label, mask in [
    (
        "county_town_name contains Sacramento",
        ca["county_town_name"].astype(str).str.contains("Sacramento", case=False, na=False),
    ),
    (
        "hud_area_name contains Sacramento",
        ca["hud_area_name"].astype(str).str.contains("Sacramento", case=False, na=False),
    ),
    (
        "county == 67 (Sacramento FIPS)",
        ca["county"] == 67,
    ),
]:
    hits = ca[mask]
    print(f"{label}: {len(hits)} rows")
    if len(hits):
        sample = hits[["county", "county_town_name", "hud_area_name", "metro"]].head(3)
        print(sample.to_string(index=False))

print("\n=== AMI band breakdown (all limit columns) ===")
bands = {}
for col in limit_cols:
    m = limit_col_pattern.match(col)
    key = f"{m.group(1)}{'_ia' if m.group(2) else ''}"
    bands[key] = bands.get(key, 0) + 1
for k in sorted(bands, key=lambda x: (int(x.split("_")[0]), "_ia" in x)):
    print(f"  {k}: {bands[k]} household-size columns")
