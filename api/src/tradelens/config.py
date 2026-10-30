"""Load the active BACI dataset's location and year coverage from JSON metadata.

The registry defaults to api/data/BACI/datasets.json. Set BACI_METADATA_PATH
before starting the application to use a different registry.

Configuration is loaded when this module is imported. Changes to the registry
therefore require restarting the application to refresh the exported settings.
"""

import json
import os
from pathlib import Path


# Locate the API directory from this file's position:
# api/src/tradelens/config.py -> api/
# This avoids depending on the directory used to launch the application.
API_ROOT = Path(__file__).resolve().parents[2]


def load_baci_config() -> tuple[Path, int, int]:
    """Load and validate the active dataset entry in the BACI registry.

    Read the JSON registry selected by the BACI_METADATA_PATH environment
    variable, or use data/BACI/datasets.json relative to the API directory.
    The registry's active_dataset field identifies an entry under datasets.

    Relative Parquet paths are resolved against the registry's directory.
    Absolute paths are used directly. A leading "~" is expanded in both
    the registry path and the Parquet path.

    Only the active entry is validated. Descriptive metadata such as release,
    classification, and notes is not used by this function.

    Returns
    -------
    tuple[Path, int, int]
        The resolved Parquet path, inclusive minimum year, and inclusive
        maximum year for the active dataset.

    Raises
    ------
    FileNotFoundError
        If the registry is missing or the selected Parquet path does not
        identify an existing file.
    json.JSONDecodeError
        If the registry does not contain valid JSON.
    ValueError
        If required configuration fields have invalid types, the active
        dataset is not registered, or the year bounds are reversed.
    OSError
        If the registry cannot be read because of a filesystem error.

    Notes
    -----
    Validation checks the declared configuration and Parquet file existence.
    It does not open the Parquet file or verify its schema or actual year
    coverage. Errors propagate to the caller; no fallback dataset is selected.
    """
    # Select the registry using an environment override or the default location.
    # expanduser() allows paths beginning with "~" to refer to the user's home.
    metadata_path = Path(
        os.environ.get("BACI_METADATA_PATH", "data/BACI/datasets.json")
    ).expanduser()

    # Anchor relative registry paths to the API directory. resolve() produces
    # an absolute path and normalizes components such as "..".
    if not metadata_path.is_absolute():
        metadata_path = API_ROOT / metadata_path
    metadata_path = metadata_path.resolve()

    # Parse the registry as UTF-8 JSON. Missing or unreadable files and malformed
    # JSON raise exceptions here rather than silently using default settings.
    with metadata_path.open(encoding="utf-8") as file:
        metadata = json.load(file)

    # The registry must be an object containing the active dataset identifier
    # and a mapping of dataset identifiers to their individual configurations.
    if not isinstance(metadata, dict):
        raise ValueError(f"{metadata_path}: expected a JSON object")

    active_dataset = metadata.get("active_dataset")
    datasets = metadata.get("datasets")

    # Require an explicit selection so adding another dataset does not
    # automatically change the file used by the API.
    if not isinstance(active_dataset, str) or not active_dataset.strip():
        raise ValueError(f"{metadata_path}: active_dataset must be a non-empty string")

    if not isinstance(datasets, dict):
        raise ValueError(f"{metadata_path}: datasets must be an object")

    if active_dataset not in datasets:
        raise ValueError(
            f"{metadata_path}: unknown active_dataset {active_dataset!r}"
        )

    # Validate only the selected entry. Inactive entries do not need to have
    # their Parquet files available on this machine.
    dataset = datasets[active_dataset]
    if not isinstance(dataset, dict):
        raise ValueError(f"Dataset {active_dataset!r}: expected an object")

    # Read the fields needed by the query service. Other metadata fields are
    # left untouched and do not affect dataset selection or validation.
    year_min = dataset.get("year_min")
    year_max = dataset.get("year_max")
    filename = dataset.get("file")

    # Use exact type checks because Python considers bool a subclass of int.
    # JSON true/false must not be accepted as valid year values.
    if type(year_min) is not int or type(year_max) is not int:
        raise ValueError(
            f"Dataset {active_dataset!r}: year_min and year_max must be integers"
        )

    # A single-year dataset is valid, but the lower bound cannot exceed
    # the upper bound.
    if year_min > year_max:
        raise ValueError(
            f"Dataset {active_dataset!r}: year_min must not exceed year_max"
        )

    if not isinstance(filename, str) or not filename.strip():
        raise ValueError(f"Dataset {active_dataset!r}: file must be a non-empty string")

    # Resolve relative dataset paths beside the registry, allowing a registry
    # and its Parquet files to be moved together without rewriting each entry.
    parquet_path = Path(filename).expanduser()
    if not parquet_path.is_absolute():
        parquet_path = metadata_path.parent / parquet_path
    parquet_path = parquet_path.resolve()

    # Catch a missing file or directory supplied as a file path before queries
    # are attempted. This does not check whether the file is valid Parquet.
    if not parquet_path.is_file():
        raise FileNotFoundError(
            f"Dataset {active_dataset!r}: Parquet file not found: {parquet_path}"
        )

    return parquet_path, year_min, year_max


# Load once at import time and expose settings for use by the query service.
# Invalid configuration prevents this module from importing successfully.
BACI_PARQUET_PATH, BACI_YEAR_MIN, BACI_YEAR_MAX = load_baci_config()