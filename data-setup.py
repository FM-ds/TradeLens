# Data-procurement script for TradeLens data
# This script downloads necessary data files from a the S3 bucket to the local filesystem.

import requests
import os

base = "https://eco-temp-cache.s3.eu-west-2.amazonaws.com/tradelens_data/"

files = [
    {
        "remote": "baci_hs17_2017_2022.parquet",
        "local": "api/baci_hs17_2017_2022.parquet"
    },
    {
        "remote": "country_embeddings_dump.json",
        "local": "api/country_embeddings_dump.json"
    },
    {
        "remote": "product_embeddings_dump.json",
        "local": "api/product_embeddings_dump.json"
    }
]


if __name__ == "__main__":
    for file in files:
        remote_url = base + file["remote"]
        local_path = file["local"]

        # Ensure the directory exists
        os.makedirs(os.path.dirname(local_path), exist_ok=True)

        # If the file already exists, skip downloading
        if os.path.exists(local_path):
            print(f"File {local_path} already exists, skipping download.")
            continue

        # Download the file
        response = requests.get(remote_url)
        if response.status_code == 200:
            with open(local_path, 'wb') as f:
                f.write(response.content)
            print(f"Downloaded {file['remote']} to {local_path}")
        else:
            print(f"Failed to download {file['remote']}: {response.status_code}")