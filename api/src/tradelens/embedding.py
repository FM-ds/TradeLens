import numpy as np
from typing import Optional, List
import json
from sentence_transformers import SentenceTransformer


def load_embeddings_data():
    # Load BGE embeddings with metadata - organized by product type
    embeddings_data = {
        "countries": [],
        "hs6_products": [],
        "cn8_products": []
    }

    # Load BGE embeddings
    try:
        with open("data/shared/country_embeddings_bge_dump.json", "r") as f:
            embeddings_data["countries"] = json.load(f)
        with open("data/shared/product_embeddings_bge_dump.json", "r") as f:
            embeddings_data["hs6_products"] = json.load(f)
        with open("data/shared/cn8_division_industry_product_embeddings_bge.json", "r") as f:
            embeddings_data["cn8_products"] = json.load(f)
    except FileNotFoundError as e:
        print(f"Warning: Could not load BGE embeddings: {e}")
        # Fallback to old embeddings if BGE embeddings are not available
        try:
            with open("data/shared/country_embeddings.json", "r") as f:
                embeddings_data["countries"] = json.load(f)
            with open("data/shared/HS6_product_embeddings.json", "r") as f:
                embeddings_data["hs6_products"] = json.load(f)
            with open("data/shared/cn8_division_industry_product_embeddings.json", "r") as f:
                embeddings_data["cn8_products"] = json.load(f)
            print("Loaded fallback embeddings (non-BGE)")
        except FileNotFoundError as fallback_error:
            print(f"Error: Could not load any embeddings: {fallback_error}")

    return embeddings_data


# Prepare numpy arrays for fast similarity search - organized by product type
def build_embedding_matrices(embeddings_data: dict):
    """Build embedding matrices for fast similarity search."""
    matrices = {}
    
    for item_type, items in embeddings_data.items():
        if items:
            matrices[item_type] = np.array([item['embedding'] for item in items])
        else:
            matrices[item_type] = np.array([])
    
    return matrices


def setup_embeddings(embeddings_data: dict):
    # Load BGE embedding model for better semantic search performance
    embedding_model = SentenceTransformer('BAAI/bge-small-en-v1.5')

    embedding_matrices = build_embedding_matrices(embeddings_data)

    return embedding_model, embedding_matrices


def get_embeddings_data_for_item_type(embeddings_data, item_type):
    """Retrieve embeddings data for a specific item type."""
    if item_type not in embeddings_data:
        raise ValueError(f"Embeddings data not found for item_type '{item_type}'")
    
    return embeddings_data[item_type]

def __construct_null_response(item_type):
    """Construct a null response when no matches are found.
    
    This could be expanded to return a message when no response is found.
    """
    return []


def search_on_code(search_term: str, items_data: List[dict], limit: int = 50):
    """Search for items based on code substring matching."""
    # Code-based substring search
    matching_items = []
    search_clean = search_term.replace(" ", "").replace(".", "")
    
    for item in items_data:
        # Get the code field - try common code field names
        code = str(item.get('code', item.get('product_code', item.get('country_code', ''))))
        code_clean = code.replace(" ", "").replace(".", "")
        
        # Check if search term is a substring of the code
        if search_clean in code_clean:
            matching_items.append({k: v for k, v in item.items() if k != "embedding"})
    
    # Sort by code length (shorter codes first) and then by code value
    matching_items.sort(key=lambda x: (
        len(str(x.get('code', x.get('product_code', x.get('country_code', ''))))),
        str(x.get('code', x.get('product_code', x.get('country_code', ''))))
    ))
    
    return matching_items[:limit]


def semantic_search(items_data: List[dict], search_term: str,
                    embedding_model, embedding_matrix: np.ndarray,
                    min_score_threshold: float = 0.7, limit: int = 50) -> np.ndarray:
    """Perform semantic similarity search using embeddings."""
    # Semantic similarity search for text-based queries
    search_emb = embedding_model.encode([search_term])[0]
    norms = np.linalg.norm(embedding_matrix, axis=1) * np.linalg.norm(search_emb)
    scores = np.dot(embedding_matrix, search_emb) / norms

    sorted_idx = np.argsort(scores)[::-1]
    sorted_scores = np.sort(scores)[::-1]

    sorted_idx = sorted_idx[sorted_scores >= min_score_threshold]
    print(sorted_scores[:limit])
    if len(sorted_idx):
        top_idx = sorted_idx[:min(limit, len(sorted_idx))]
        return [
            __remove_embedding_from_item(items_data[i])
            for i in top_idx
        ]

    return []


def __remove_embedding_from_item(responce_item: dict):
    return {k: v for k, v in responce_item.items() if k != "embedding"}

def __perfect_str_match(match_key: str, search_term: str):
    component_to_match = match_key[:len(search_term)].lower()
    return (search_term.lower() == component_to_match)

def __search_term_in_key(match_key: str, search_term: str):
    return (search_term.lower() in match_key.lower())


def __string_match(items_data, search_term: str, item_string_name: str) -> List[dict]:
    if len(search_term) > 4:
        return [
            __remove_embedding_from_item(item)
            for item in items_data if __search_term_in_key(
                item[item_string_name].lower(), search_term)
        ]
    elif len(search_term):
        return [
            __remove_embedding_from_item(item)
            for item in items_data if __perfect_str_match(
                item[item_string_name].lower(), search_term)
        ]
    return []

def string_match(item_type: str, search_term: str,
                 items_data: List[dict]) -> List[dict]:
    if item_type == "countries":
        return __string_match(items_data, search_term, "country_name")
    elif item_type == "hs6_products":
        return __string_match(items_data, search_term, "description")
    elif item_type == "cn8_products":
        return __string_match(items_data, search_term, "description")
    return []


#### Core autocomplete function using embeddings
def embedding_autocomplete(
    search_term: Optional[str],
    item_type: str,  # "hs6_products", "cn8_products", or "countries"
    embeddings_data: dict,
    embedding_model,
    embedding_matrices: dict,
    type_filter: Optional[str] = None,
    limit: int = 50,
    min_score_threshold: float = 0.7,
) -> List[dict]:
    """
    Core function for autocomplete using embeddings similarity search.
    
    Args:
        search_term: The search query (None returns first N items)
        item_type: Type of items to search ("hs6_products", "cn8_products", or "countries")
        type_filter: Optional filter by type field
        limit: Maximum number of results
    
    Returns:
        List of matching items without embedding data
    """
    items_data = get_embeddings_data_for_item_type(embeddings_data, item_type)

    if not items_data:
        return __construct_null_response(item_type)
    
    # Apply type filter if specified
    if type_filter:
        items_data = [item for item in items_data if item.get('type') == type_filter]
    
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
    
    if is_code_search:
        return search_on_code(search_term, items_data, limit=limit)
    else:
        valid_response = semantic_search(
            items_data, search_term, embedding_model,
            embedding_matrix,
            min_score_threshold=min_score_threshold,
            limit=limit)

        if not len(valid_response):
            valid_response = string_match(item_type, search_term, items_data)

        if len(valid_response):
            return valid_response
        else:
            return __construct_null_response(item_type)
