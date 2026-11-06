import json
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
logger = logging.getLogger("tradelens.data_loading")


def prepend_code_with_0(value, code_width=None):
    """Insert leading 0 into the 'code' field of a dict.
    
    Some codes from HS6 and CN8 datasets should start with 0. When they are loaded
    in from json files, they are  missing leading zeros because they are interpreted
    as integers. This function adds missing zeroes into the codes until the code is the
    expected number of characters.
    
    Parameters
    ----------
    value : dict or list
        The value to process. If it's a dict, it will look for a 'code'
        key and prepend a leading 0 if necessary. If it's a list, it will
        recursively process each item in the list.
    code_width : int, optional
        The expected width of the code. If provided, the function will ensure that the code is
        padded with leading zeros to match this width.
    """
    if isinstance(value, dict):
        return {
            k: (
                str(item).zfill(code_width) if code_width else str(item)
            ) if k == "code" else prepend_code_with_0(item, code_width=code_width)
            for k, item in value.items()
        }
    if isinstance(value, list):
        return [prepend_code_with_0(item, code_width=code_width) for item in value]
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
            embeddings_data["hs6_products"] = prepend_code_with_0(json.load(f), code_width=6)
        with open(f"{base_directory}data/shared/cn8_division_industry_product_embeddings_bge.json", "r") as f:
            embeddings_data["cn8_products"] = prepend_code_with_0(json.load(f), code_width=8)
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
                embeddings_data["hs6_products"] = prepend_code_with_0(json.load(f), code_width=6)
            with open(f"{base_directory}data/shared/cn8_division_industry_product_embeddings.json", "r") as f:
                embeddings_data["cn8_products"] = prepend_code_with_0(json.load(f), code_width=8)
            logger.info(
                "Loaded fallback embeddings: countries=%d hs6_products=%d cn8_products=%d",
                len(embeddings_data["countries"]),
                len(embeddings_data["hs6_products"]),
                len(embeddings_data["cn8_products"])
            )
        except FileNotFoundError as fallback_error:
            logger.error("Could not load any embeddings: %s", fallback_error)

    return embeddings_data
