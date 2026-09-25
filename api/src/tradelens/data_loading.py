import json
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
logger = logging.getLogger("tradelens.data_loading")


def stringify_json_values(value, code_width=None):
    if isinstance(value, dict):
        return {
            k: (
                str(item).zfill(code_width) if code_width else str(item)
            ) if k == "code" else stringify_json_values(item, code_width=code_width)
            for k, item in value.items()
        }
    if isinstance(value, list):
        return [stringify_json_values(item, code_width=code_width) for item in value]
    return value


def load_embeddings_data(base_directory: str = "") -> dict:
    """
    Load BGE embeddings data from disk, organised by product type.

    Attempts to load BGE embeddings first; falls back to standard
    (non-BGE) embeddings if the BGE files are not present.

    Returns
    -------
    dict
        Dictionary with keys ``'countries'``, ``'hs6_products'``, and
        ``'cn8_products'``, each mapping to a list of embedding dicts.
    """
    # Load BGE embeddings with metadata - organized by product type
    embeddings_data = {
        "countries": [],
        "hs6_products": [],
        "cn8_products": []
    }

    # Load BGE embeddings
    try:
        logger.info("Loading BGE embeddings from data/shared")
        with open(f"{base_directory}data/shared/country_embeddings_bge_dump.json", "r") as f:
            embeddings_data["countries"] = json.load(f)
        with open(f"{base_directory}data/shared/product_embeddings_bge_dump.json", "r") as f:
            embeddings_data["hs6_products"] = stringify_json_values(json.load(f), code_width=6)
        with open(f"{base_directory}data/shared/cn8_division_industry_product_embeddings_bge.json", "r") as f:
            embeddings_data["cn8_products"] = stringify_json_values(json.load(f), code_width=8)
        logger.info(
            "Loaded BGE embeddings: countries=%d hs6_products=%d cn8_products=%d",
            len(embeddings_data["countries"]),
            len(embeddings_data["hs6_products"]),
            len(embeddings_data["cn8_products"])
        )
    except FileNotFoundError as e:
        logger.warning("Could not load BGE embeddings: %s", e)
        # Fallback to old embeddings if BGE embeddings are not available
        try:
            logger.info("Loading fallback embeddings from data/shared")
            with open(f"{base_directory}data/shared/country_embeddings.json", "r") as f:
                embeddings_data["countries"] = json.load(f)
            with open(f"{base_directory}data/shared/HS6_product_embeddings.json", "r") as f:
                embeddings_data["hs6_products"] = stringify_json_values(json.load(f), code_width=6)
            with open(f"{base_directory}data/shared/cn8_division_industry_product_embeddings.json", "r") as f:
                embeddings_data["cn8_products"] = stringify_json_values(json.load(f), code_width=8)
            logger.info(
                "Loaded fallback embeddings: countries=%d hs6_products=%d cn8_products=%d",
                len(embeddings_data["countries"]),
                len(embeddings_data["hs6_products"]),
                len(embeddings_data["cn8_products"])
            )
        except FileNotFoundError as fallback_error:
            logger.error("Could not load any embeddings: %s", fallback_error)

    return embeddings_data
