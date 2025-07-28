# Data-procurement script for TradeLens data
# This script downloads necessary data files from the S3 bucket to the local filesystem.
# It sets up the complete data directory structure with BACI, PRODCOM, and shared data files.
#
# Usage:
#   python data-setup.py
#
# Requirements:
#   pip install requests
#
# File Structure:
# api/data/
# ├── BACI/
# │   └── baci_hs17_2017_2022.parquet     # International trade data (BACI HS17 classification)
# ├── prodcom/
# │   └── prodcom.parquet                 # EU manufacturing data (PRODCOM classification)
# └── shared/
#     ├── HS6_products.json               # HS6 product codes and descriptions
#     ├── HS6_product_embeddings.json     # Vector embeddings for HS6 products
#     ├── cn8_division_industry_product.json          # CN8 product hierarchy
#     ├── cn8_division_industry_product_embeddings.json  # Vector embeddings for CN8 products
#     ├── countries.json                  # Country codes and names
#     └── country_embeddings.json         # Vector embeddings for countries

import requests
import os

base = "https://eco-temp-cache.s3.eu-west-2.amazonaws.com/tradelens_data/"

# List of all data files to download from S3
# Each file contains the remote S3 path and local filesystem path
files = [
    # BACI dataset files
    {
        "remote": "BACI/baci_hs17_2017_2022.parquet",
        "local": "api/data/BACI/baci_hs17_2017_2022.parquet"
    },
    
    # PRODCOM dataset files
    {
        "remote": "prodcom/prodcom.parquet",
        "local": "api/data/prodcom/prodcom.parquet"
    },
    
    # Shared data files (product and country taxonomies)
    {
        "remote": "shared/HS6_product_embeddings.json",
        "local": "api/data/shared/HS6_product_embeddings.json"
    },
    {
        "remote": "shared/HS6_products.json",
        "local": "api/data/shared/HS6_products.json"
    },
    {
        "remote": "shared/cn8_division_industry_product.json",
        "local": "api/data/shared/cn8_division_industry_product.json"
    },
    {
        "remote": "shared/cn8_division_industry_product_embeddings.json",
        "local": "api/data/shared/cn8_division_industry_product_embeddings.json"
    },
    {
        "remote": "shared/countries.json",
        "local": "api/data/shared/countries.json"
    },
    {
        "remote": "shared/country_embeddings.json",
        "local": "api/data/shared/country_embeddings.json"
    }
]


if __name__ == "__main__":
    print("TradeLens Data Setup")
    print("===================")
    print(f"Downloading {len(files)} data files from S3...")
    print()
    
    downloaded = 0
    skipped = 0
    failed = 0
    
    for i, file in enumerate(files, 1):
        remote_url = base + file["remote"]
        local_path = file["local"]
        
        print(f"[{i}/{len(files)}] Processing {file['remote']}")

        # Ensure the directory exists
        os.makedirs(os.path.dirname(local_path), exist_ok=True)

        # If the file already exists, skip downloading
        if os.path.exists(local_path):
            print(f"  ✓ Already exists: {local_path}")
            skipped += 1
            continue

        # Download the file
        try:
            print(f"  → Downloading from {remote_url}")
            response = requests.get(remote_url, timeout=30)
            
            if response.status_code == 200:
                with open(local_path, 'wb') as f:
                    f.write(response.content)
                file_size = len(response.content)
                print(f"  ✓ Downloaded to {local_path} ({file_size:,} bytes)")
                downloaded += 1
            else:
                print(f"  ✗ Failed to download: HTTP {response.status_code}")
                failed += 1
        except Exception as e:
            print(f"  ✗ Error downloading {file['remote']}: {str(e)}")
            failed += 1
    
    print()
    print("Summary:")
    print(f"  Downloaded: {downloaded} files")
    print(f"  Skipped (already exists): {skipped} files")
    print(f"  Failed: {failed} files")
    print()
    
    if failed == 0:
        print("✓ Data setup completed successfully!")
    else:
        print(f"⚠ Data setup completed with {failed} failures.")
        print("Please check network connectivity and S3 bucket accessibility.")