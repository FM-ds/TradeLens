import pandas as pd
from pathlib import Path

# Get the absolute path of the current file
file_path = Path(__file__).resolve()
# Get the root directory
root_path = file_path.parent.parent.parent
print(root_path)
data_ext="V202601"
data_version="HS17"
data_root=f"data/BACI_{data_version}_{data_ext}"
start_year=2017
end_year=2024

save_loc=f"{root_path}/api/data/BACI/baci_{data_version}_{data_ext}_{start_year}_{end_year}.parquet"

##### 
dfs = {}
for year in range(start_year, end_year + 1):
    print(f"Loading data for year {year}...")
    file_path = f'{data_root}/BACI_{data_version}_Y{year}_{data_ext}.csv'
    dfs[year] = pd.read_csv(file_path)

print(f"Loaded {len(dfs)} dataframes for years {list(dfs.keys())}")

all_data = pd.concat(dfs.values(), ignore_index=True)
all_data = all_data.rename(columns={
    't': 'year',
    'i': 'exporter',
    'j': 'importer',
    'k': 'product',
    'v': 'value',
    'q': 'quantity'
})

# Merge in the country and product names
print("Merging country and product names...")
country_names = pd.read_csv(f'{data_root}/country_codes_{data_ext}.csv') #country_code	country_name	country_iso2	country_iso3
product_names = pd.read_csv(f'{data_root}/product_codes_{data_version}_{data_ext}.csv') #code	description

country_names = country_names[['country_code', 'country_name']]
product_names = product_names[['code', 'description']]

country_names = country_names.set_index('country_code')
product_names = product_names.set_index('code')

print("Mapping country and product names...")
all_data['exporter_name'] = all_data['exporter'].map(country_names['country_name'])
all_data['importer_name'] = all_data['importer'].map(country_names['country_name'])
all_data['product_description'] = all_data['product'].map(product_names['description']) 

# save data
print(f"Saving data to {save_loc}...")
all_data.to_parquet(save_loc, index=False)