# Prepare BACI international trade data for the TradeLens online platform.
# Run this script from data-prep/BACI so the relative input paths resolve.
# Requires pandas and a pandas-compatible Parquet engine (pyarrow or fastparquet).
# Before running, extract the BACI release into data/BACI_HS17_V202601/
# (or the matching folder for the release configured below). It must contain
# the annual trade CSVs and the country/product code lookup CSVs.
# The script combines the selected years, adds readable country/product names,
# and writes one Parquet file to api/data/BACI. That output folder must exist.
# All annual files and the combined dataset are held in memory during processing.

import pandas as pd
from pathlib import Path
import json
from tempfile import NamedTemporaryFile

# Locate the repository root from this script's location, independently of the
# working directory. __file__ is available when running as a Python script,
# but not when copying this code directly into a notebook cell.
file_path = Path(__file__).resolve()
root_path = file_path.parent.parent.parent
print(root_path)

# Select the BACI release, product classification, and inclusive year range.
# HS17 identifies the 2017 Harmonized System product classification.
# Input paths are relative to the working directory, not root_path.
data_ext="V202601"
data_version="HS17"
data_root=f"data/BACI_{data_version}_{data_ext}"
start_year=2017
end_year=2024
dataset_store_path = "datasets.json" # path to stored dataset metadata

# Include the release and year range in the output filename so datasets can be
# distinguished. Saving replaces any existing file at this exact path.
save_loc=f"{root_path}/api/data/BACI/baci_{data_version}_{data_ext}_{start_year}_{end_year}.parquet"

# Read one trade CSV per year and keep each DataFrame keyed by its year.
dfs = {}
for year in range(start_year, end_year + 1):
    print(f"Loading data for year {year}...")
    file_path = f'{data_root}/BACI_{data_version}_Y{year}_{data_ext}.csv'
    dfs[year] = pd.read_csv(file_path)

print(f"Loaded {len(dfs)} dataframes for years {list(dfs.keys())}")

# Stack the yearly records into one table with a fresh, continuous row index.
all_data = pd.concat(dfs.values(), ignore_index=True)

# Replace BACI's short field names with the names used by the platform.
# Each record describes a product traded from an exporter to an importer in
# one year. BACI value is in thousands of US dollars; quantity is in metric tons.
all_data = all_data.rename(columns={
    't': 'year',
    'i': 'exporter',
    'j': 'importer',
    'k': 'product',
    'v': 'value',
    'q': 'quantity'
})

# Load lookup tables that translate numeric country and product codes into
# readable labels, using the same release/classification as the trade files.
print("Merging country and product names...")
country_names = pd.read_csv(f'{data_root}/country_codes_{data_ext}.csv') #country_code	country_name	country_iso2	country_iso3
product_names = pd.read_csv(f'{data_root}/product_codes_{data_version}_{data_ext}.csv') #code	description

# Keep only the lookup keys and labels needed for enrichment.
country_names = country_names[['country_code', 'country_name']]
product_names = product_names[['code', 'description']]

# Index each lookup by its code so Series.map can match the trade table's codes.
country_names = country_names.set_index('country_code')
product_names = product_names.set_index('code')

# Add labels without removing the original codes or changing the row count.
# Codes absent from a lookup produce missing (NaN) labels.
print("Mapping country and product names...")
all_data['exporter_name'] = all_data['exporter'].map(country_names['country_name'])
all_data['importer_name'] = all_data['importer'].map(country_names['country_name'])
all_data['product_description'] = all_data['product'].map(product_names['description']) 

# Write the enriched table in Parquet format for the platform's data-loading
# layer. Exclude the temporary pandas row index from the saved dataset.
print(f"Saving data to {save_loc}...")
all_data.to_parquet(save_loc, index=False)

# Register the dataset only after the Parquet file has been saved successfully.
metadata_path = Path(save_loc).parent / dataset_store_path

with metadata_path.open(encoding="utf-8") as file:
    metadata = json.load(file)

if not isinstance(metadata, dict) or not isinstance(metadata.get("datasets"), dict):
    raise ValueError(f"{metadata_path}: expected a registry with a datasets object")

# Match the identifiers already used in the registry.
dataset_id = f"baci_{data_version.lower()}_{data_ext.lower()}"
datasets = metadata["datasets"]

# Preserve existing descriptions, notes, and other manually maintained fields.
entry = datasets.setdefault(dataset_id, {})
entry.setdefault(
    "description",
    f"BACI {data_version} classification, {data_ext} release",
)
entry.update({
    "classification": data_version,
    "release": data_ext,
    "year_min": start_year,
    "year_max": end_year,
    "file": Path(save_loc).name,
})

# Write a temporary file beside the registry, then replace it only once the
# complete JSON has been written. Leave active_dataset unchanged.
temporary_path = None
try:
    with NamedTemporaryFile(
        mode="w",
        encoding="utf-8",
        dir=metadata_path.parent,
        suffix=".tmp",
        delete=False,
    ) as file:
        temporary_path = Path(file.name)
        json.dump(metadata, file, indent=2, ensure_ascii=False)
        file.write("\n")

    temporary_path.replace(metadata_path)
finally:
    if temporary_path is not None:
        temporary_path.unlink(missing_ok=True)

print(f"Registered dataset {dataset_id} in {metadata_path}")