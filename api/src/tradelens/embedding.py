import numpy as np
from typing import Optional, List
import json
import logging
from sentence_transformers import SentenceTransformer


logger = logging.getLogger("tradelens.embedding")

item_type_2_string_name = {"countries": "country_name",
                           "hs6_products": "description",
                           "cn8_products": "description"}

item_type_2_code_name = {"countries": "code",
                         "hs6_products": "code",
                         "cn8_products": "code"}


def get_semantic_threshold(searchterm_length: int, min_threshold: float = 0.6) -> float:
    """
    Determine the minimum similarity score threshold based on the length of the search term.

    Parameters
    ----------
    searchterm_length : int
        Length of the search term.

    Returns
    -------
    float
        Minimum similarity score threshold.
    """
    if searchterm_length < 3:
        return 0.9
    elif searchterm_length == 3:
        return 0.8
    elif searchterm_length == 4:
        return 0.75
    else:
        return min_threshold


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
            embeddings_data["hs6_products"] = json.load(f)
        with open(f"{base_directory}data/shared/cn8_division_industry_product_embeddings_bge.json", "r") as f:
            embeddings_data["cn8_products"] = json.load(f)
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
                embeddings_data["hs6_products"] = json.load(f)
            with open(f"{base_directory}data/shared/cn8_division_industry_product_embeddings.json", "r") as f:
                embeddings_data["cn8_products"] = json.load(f)
            logger.info(
                "Loaded fallback embeddings: countries=%d hs6_products=%d cn8_products=%d",
                len(embeddings_data["countries"]),
                len(embeddings_data["hs6_products"]),
                len(embeddings_data["cn8_products"])
            )
        except FileNotFoundError as fallback_error:
            logger.error("Could not load any embeddings: %s", fallback_error)

    return embeddings_data


# Prepare numpy arrays for fast similarity search - organized by product type
def build_embedding_matrices(embeddings_data: dict):
    """
    Build numpy embedding matrices for fast cosine-similarity search.

    Parameters
    ----------
    embeddings_data : dict
        Dictionary returned by :func:`load_embeddings_data`, containing
        lists of embedding dicts keyed by item type.

    Returns
    -------
    dict
        Dictionary mapping each item-type key to a 2-D ``np.ndarray``
        of shape ``(n_items, embedding_dim)``, or an empty array when
        no items exist for that key.
    """
    matrices = {}

    for item_type, items in embeddings_data.items():
        if items:
            matrices[item_type] = np.array(
                [item['embedding'] for item in items])
        else:
            matrices[item_type] = np.array([])

    return matrices


def setup_embeddings(embeddings_data: dict):
    """
    Initialise the sentence-transformer model and precompute embedding matrices.

    Parameters
    ----------
    embeddings_data : dict
        Dictionary returned by :func:`load_embeddings_data`.

    Returns
    -------
    embedding_model : SentenceTransformer
        Loaded BGE sentence-transformer model.
    embedding_matrices : dict
        Precomputed numpy matrices as returned by
        :func:`build_embedding_matrices`.
    """
    # Load BGE embedding model for better semantic search performance
    logger.info("Loading embedding model: BAAI/bge-small-en-v1.5")
    embedding_model = SentenceTransformer('BAAI/bge-small-en-v1.5')

    embedding_matrices = build_embedding_matrices(embeddings_data)
    logger.info(
        "Prepared embedding matrices: countries=%d hs6_products=%d cn8_products=%d",
        embedding_matrices["countries"].shape[0] if embedding_matrices["countries"].size else 0,
        embedding_matrices["hs6_products"].shape[0] if embedding_matrices["hs6_products"].size else 0,
        embedding_matrices["cn8_products"].shape[0] if embedding_matrices["cn8_products"].size else 0
    )

    return embedding_model, embedding_matrices


def get_embeddings_data_for_item_type(embeddings_data, item_type):
    """
    Retrieve the embeddings list for a specific item type.

    Parameters
    ----------
    embeddings_data : dict
        Dictionary returned by :func:`load_embeddings_data`.
    item_type : str
        One of ``'countries'``, ``'hs6_products'``, or ``'cn8_products'``.

    Returns
    -------
    list of dict
        List of embedding dicts for the requested item type.

    Raises
    ------
    ValueError
        If ``item_type`` is not present in ``embeddings_data``.
    """
    if item_type not in embeddings_data:
        raise ValueError(
            f"Embeddings data not found for item_type '{item_type}'")

    return embeddings_data[item_type]


def __construct_null_response(item_type):
    """
    Construct an empty response when no matches are found.

    Parameters
    ----------
    item_type : str
        The item type for which no results were found.  Currently unused
        but retained for potential future use (e.g. diagnostic messages).

    Returns
    -------
    list
        An empty list.
    """
    return []


def search_on_code(search_term: str, item_type: str, items_data: List[dict],
                   limit: int = 50):
    """
    Search for items whose code field contains the search term as a substring.

    Strips spaces and dots from both the search term and the item code
    before comparing.  Results are sorted by code length (ascending) then
    alphabetically.

    Parameters
    ----------
    search_term : str
        Numeric string (digits, spaces, and dots) to look up.
    item_type : str
        One of ``'countries'``, ``'hs6_products'``, or ``'cn8_products'``.
    items_data : list of dict
        List of item dicts, each expected to contain a ``'code'``,
        ``'product_code'``, or ``'country_code'`` field.
    limit : int, optional
        Maximum number of results to return.  Default is 50.

    Returns
    -------
    list of dict
        Matching items (without their ``'embedding'`` field) up to *limit*.
    """
    # Code-based substring search
    matching_items = []
    search_clean = search_term.replace(" ", "").replace(".", "")

    code_name = item_type_2_code_name[item_type]

    for item in items_data:
        # Get the code field
        code = str(item.get(code_name, ''))
        code_clean = code.replace(" ", "").replace(".", "")

        # Check if search term is a substring of the code
        if __match_key_starts_with_search_term(code_clean, search_clean):
            matching_items.append(__remove_embedding_from_item(item))

    # Sort by code length (shorter codes first) and then by code value
    matching_items.sort(key=lambda x: (
        len(str(x.get(code_name, ''))),
        str(x.get(code_name, ''))
    ))

    return matching_items[:limit]


def semantic_search(items_data: List[dict], search_term: str,
                    embedding_model, embedding_matrix: np.ndarray,
                    min_score_threshold: float = 0.6, limit: int = 50) -> np.ndarray:
    """
    Perform cosine-similarity semantic search over a precomputed embedding matrix.

    Parameters
    ----------
    items_data : list of dict
        List of item dicts that correspond row-for-row to *embedding_matrix*.
    search_term : str
        Free-text query to encode and compare against the matrix.
    embedding_model : SentenceTransformer
        Model used to encode *search_term* into a vector.
    embedding_matrix : np.ndarray
        2-D array of shape ``(n_items, embedding_dim)`` produced by
        :func:`build_embedding_matrices`.
    min_score_threshold : float, optional
        Minimum cosine-similarity score for a result to be included.
        Default is 0.6.
    limit : int, optional
        Maximum number of results to return.  Default is 50.

    Returns
    -------
    list of dict
        Items (without ``'embedding'`` field) sorted by descending similarity
        score, or an empty list when no items meet *min_score_threshold*.
    """
    # Semantic similarity search for text-based queries
    search_emb = embedding_model.encode([search_term])[0]
    norms = np.linalg.norm(embedding_matrix, axis=1) * \
        np.linalg.norm(search_emb)

    # get cosine similarity scores for all possible items given the search term
    scores = np.dot(embedding_matrix, search_emb) / norms

    # sort the scores in descending order and get the indices of the sorted scores
    sorted_idx = np.argsort(scores)[::-1]
    sorted_scores = np.sort(scores)[::-1]

    # filter out the index of items below the minimum score threshold
    sorted_idx = sorted_idx[sorted_scores >= min_score_threshold]

    if len(sorted_idx):
        # return the top N items (up to *limit*) that meet the threshold,
        # without their embeddings
        top_idx = sorted_idx[:min(limit, len(sorted_idx))]
        return [
            __remove_embedding_from_item(items_data[i])
            for i in top_idx
        ]

    return []


def __remove_embedding_from_item(response_item: dict):
    """
    Return a copy of an item dict with the ``'embedding'`` key removed.

    Parameters
    ----------
    response_item : dict
        A single item dict that may contain an ``'embedding'`` key.

    Returns
    -------
    dict
        Copy of *response_item* without the ``'embedding'`` field.
    """
    return {k: v for k, v in response_item.items() if k != "embedding"}


def __match_key_starts_with_search_term(match_key: str, search_term: str):
    """
    Check whether *match_key* starts with *search_term* (case-insensitive).

    Parameters
    ----------
    match_key : str
        The string field of an item to test against.
    search_term : str
        Short query string (typically 4 characters or fewer).

    Returns
    -------
    bool
        ``True`` if the leading characters of *match_key* equal *search_term*.
    """
    component_to_match = match_key[:len(search_term)].lower()
    return (search_term.lower() == component_to_match)


def __search_term_in_key(match_key: str, search_term: str):
    """
    Check whether *search_term* appears anywhere in *match_key* (case-insensitive).

    Parameters
    ----------
    match_key : str
        The string field of an item to search within.
    search_term : str
        Query string to locate as a substring.

    Returns
    -------
    bool
        ``True`` if *search_term* is a substring of *match_key*.
    """
    return (search_term.lower() in match_key.lower())


def __string_match(items_data, search_term: str, item_string_name: str) -> List[dict]:
    """
    Filter items by string matching against a named text field.

    Uses :func:`__search_term_in_key` (substring) for queries longer than
    4 characters, and :func:`__match_key_starts_with_search_term` (prefix)
    for shorter ones.

    Parameters
    ----------
    items_data : list of dict
        List of item dicts to filter.
    search_term : str
        Text query to match.
    item_string_name : str
        The dict key whose value is compared against *search_term*.

    Returns
    -------
    list of dict
        Matching items without their ``'embedding'`` field, or an empty list
        when *search_term* is empty.
    """
    if len(search_term) > 3:
        return [
            __remove_embedding_from_item(item)
            for item in items_data if __search_term_in_key(
                item[item_string_name].lower(), search_term)
        ]
    elif len(search_term):
        return [
            __remove_embedding_from_item(item)
            for item in items_data if __match_key_starts_with_search_term(
                item[item_string_name].lower(), search_term)
        ]
    return []


def string_match(item_type: str, search_term: str,
                 items_data: List[dict]) -> List[dict]:
    """
    Dispatch string matching to the correct field based on *item_type*.

    Parameters
    ----------
    item_type : str
        One of ``'countries'``, ``'hs6_products'``, or ``'cn8_products'``.
    search_term : str
        Text query to match.
    items_data : list of dict
        List of item dicts to search.

    Returns
    -------
    list of dict
        Matching items without their ``'embedding'`` field, or an empty list
        when *item_type* is unrecognised.
    """
    if item_type in item_type_2_string_name:
        return __string_match(
            items_data, search_term, item_type_2_string_name[item_type])

    return []


def embedding_autocomplete(
    search_term: Optional[str],
    item_type: str,  # "hs6_products", "cn8_products", or "countries"
    embeddings_data: dict,
    embedding_model,
    embedding_matrices: dict,
    type_filter: Optional[str] = None,
    limit: int = 50,
    min_score_threshold: float = 0.6,
) -> List[dict]:
    """
    Core autocomplete function using embedding similarity search.

    Routes the query through code search, semantic search, or string
    matching depending on the content of *search_term*.  Falls back
    through each strategy in order until results are found.

    Parameters
    ----------
    search_term : str or None
        The search query.  ``None`` or an empty string returns the first
        *limit* items without any ranking.
    item_type : str
        Type of items to search.  One of ``'hs6_products'``,
        ``'cn8_products'``, or ``'countries'``.
    embeddings_data : dict
        Dictionary returned by :func:`load_embeddings_data`.
    embedding_model : SentenceTransformer
        Loaded sentence-transformer model used for semantic search.
    embedding_matrices : dict
        Precomputed numpy matrices returned by :func:`build_embedding_matrices`.
    type_filter : str or None, optional
        When provided, restricts results to items whose ``'type'`` field
        equals this value.  Default is ``None`` (no filter).
    limit : int, optional
        Maximum number of results to return.  Default is 50.
    min_score_threshold : float, optional
        Minimum similarity score passed to :func:`semantic_search`.
        Default is 0.6.

    Returns
    -------
    list of dict
        Matching items without their ``'embedding'`` field, or an empty
        list when no items are found.
    """
    # for each available item type [countries, hs6_products, cn8_products]
    # there is a list of acceptable values that can be returned.
    # items_data contains the list of items for the requested item_type.
    items_data = get_embeddings_data_for_item_type(embeddings_data, item_type)

    if not items_data:
        return __construct_null_response(item_type)

    # Apply type filter if specified
    if type_filter:
        items_data = [item for item in items_data if item.get(
            'type') == type_filter]

    if not search_term:
        # Return first N items without embeddings
        return [
            __remove_embedding_from_item(item)
            for item in items_data[:limit]
        ]

    # Get embedding matrix for similarity search
    if item_type not in embedding_matrices:
        return __construct_null_response(item_type)

    embedding_matrix = embedding_matrices[item_type]
    if embedding_matrix.size == 0:
        return __construct_null_response(item_type)

    # If we applied type filter, we need to rebuild the embedding matrix
    if type_filter:
        embedding_matrix = np.array([item['embedding'] for item in items_data])
        if embedding_matrix.size == 0:
            return __construct_null_response(item_type)

    # Check if search term is numeric (code search) - allow digits, spaces, and dots
    is_code_search = search_term.replace(" ", "").replace(".", "").isdigit()

    # carry out specific string matching on the code (country code or product code) 
    # if the search term is numeric
    if is_code_search:
        logger.info(f"Performing code-based search for '{search_term}' in '{item_type}'")
        return search_on_code(search_term, item_type, items_data, limit=limit)
    else:
        # for short search terms (2 characters or fewer), use string matching;
        # for longer terms, use semantic search
        if len(search_term) <= 2:
            logger.info(f"Performing string-based search for '{search_term}' in '{item_type}'")
            valid_response = string_match(item_type, search_term, items_data)
        else:
            # Determine the semantic score threshold based on the length of the search term.
            # shorter search terms require a higher threshold. Relationship between search_term length
            # and threshold is defined in get_semantic_threshold function. Could be moved to config if needed.
            logger.info(f"Performing semantic search for '{search_term}' in '{item_type}'")
            semantic_score_threshold = get_semantic_threshold(
                len(search_term),
                min_threshold=min_score_threshold)

            logger.info(
                f"Performing semantic search for '{search_term}' in '{item_type}' with threshold {semantic_score_threshold}")

            valid_response = semantic_search(
                items_data, search_term, embedding_model,
                embedding_matrix,
                min_score_threshold=semantic_score_threshold,
                limit=limit)

            # if semantic search returns no results, fall back to string matching
            if not len(valid_response):
                logger.info(
                    f"No semantic search results for '{search_term}' in '{item_type}',"
                    " falling back to string match")
                valid_response = string_match(item_type, search_term, items_data)
            else:
                logger.info(
                    f"Found {len(valid_response)} semantic search results for "
                    f"'{search_term}' in '{item_type}'")

        # return results if any were found through string matching or semantic search,
        # otherwise return an empty list.
        if len(valid_response):
            logger.info(f"Found {len(valid_response)} results for '{search_term}' in '{item_type}'")
            return valid_response
        else:
            logger.info(f"No response found for '{search_term}' in '{item_type}'")
            return __construct_null_response(item_type)
