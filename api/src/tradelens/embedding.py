import numpy as np
from typing import Optional, List
import json
from sentence_transformers import SentenceTransformer


# Load BGE embeddings with metadata - organized by product type
EMBEDDINGS_DATA = {
    "countries": [],
    "hs6_products": [],
    "cn8_products": []
}

# Load BGE embeddings
try:
    with open("data/shared/country_embeddings_bge_dump.json", "r") as f:
        EMBEDDINGS_DATA["countries"] = json.load(f)
    with open("data/shared/product_embeddings_bge_dump.json", "r") as f:
        EMBEDDINGS_DATA["hs6_products"] = json.load(f)
    with open("data/shared/cn8_division_industry_product_embeddings_bge.json", "r") as f:
        EMBEDDINGS_DATA["cn8_products"] = json.load(f)
except FileNotFoundError as e:
    print(f"Warning: Could not load BGE embeddings: {e}")
    # Fallback to old embeddings if BGE embeddings are not available
    try:
        with open("data/shared/country_embeddings.json", "r") as f:
            EMBEDDINGS_DATA["countries"] = json.load(f)
        with open("data/shared/HS6_product_embeddings.json", "r") as f:
            EMBEDDINGS_DATA["hs6_products"] = json.load(f)
        with open("data/shared/cn8_division_industry_product_embeddings.json", "r") as f:
            EMBEDDINGS_DATA["cn8_products"] = json.load(f)
        print("Loaded fallback embeddings (non-BGE)")
    except FileNotFoundError as fallback_error:
        print(f"Error: Could not load any embeddings: {fallback_error}")


# Prepare numpy arrays for fast similarity search - organized by product type
def build_embedding_matrices():
    """Build embedding matrices for fast similarity search."""
    matrices = {}
    
    for item_type, items in EMBEDDINGS_DATA.items():
        if items:
            matrices[item_type] = np.array([item['embedding'] for item in items])
        else:
            matrices[item_type] = np.array([])
    
    return matrices


# Load BGE embedding model for better semantic search performance
EMBEDDING_MODEL = SentenceTransformer('BAAI/bge-small-en-v1.5')

EMBEDDING_MATRICES = build_embedding_matrices()


#### Core autocomplete function using embeddings
def embedding_autocomplete(
    search_term: Optional[str],
    item_type: str,  # "hs6_products", "cn8_products", or "countries"
    type_filter: Optional[str] = None,
    limit: int = 50
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
    
    # Get the embeddings data for the specified item type
    if item_type not in EMBEDDINGS_DATA:
        raise ValueError(f"Embeddings data not found for item_type '{item_type}'")
    
    items_data = EMBEDDINGS_DATA[item_type]
    if not items_data:
        return []
    
    # Apply type filter if specified
    if type_filter:
        items_data = [item for item in items_data if item.get('type') == type_filter]
    
    if not search_term:
        # Return first N items without embeddings
        return [
            {k: v for k, v in item.items() if k != "embedding"}
            for item in items_data[:limit]
        ]
    
    # Get embedding matrix for similarity search
    if item_type not in EMBEDDING_MATRICES:
        return []
    
    embedding_matrix = EMBEDDING_MATRICES[item_type]
    if embedding_matrix.size == 0:
        return []
    
    # If we applied type filter, we need to rebuild the embedding matrix
    if type_filter:
        embedding_matrix = np.array([item['embedding'] for item in items_data])
        if embedding_matrix.size == 0:
            return []
    
    # Check if search term is numeric (code search) - allow digits, spaces, and dots
    is_code_search = search_term.replace(" ", "").replace(".", "").isdigit()
    
    if is_code_search:
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
    else:
        # Semantic similarity search for text-based queries
        search_emb = EMBEDDING_MODEL.encode([search_term])[0]
        norms = np.linalg.norm(embedding_matrix, axis=1) * np.linalg.norm(search_emb)
        scores = np.dot(embedding_matrix, search_emb) / norms
        top_idx = np.argsort(scores)[::-1][:limit]
        
        return [
            {k: v for k, v in items_data[i].items() if k != "embedding"}
            for i in top_idx
        ]
