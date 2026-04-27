from fastapi import APIRouter, Query, HTTPException
from typing import Optional, List

from tradelens.embedding import embedding_autocomplete
from tradelens.prodcom_service import search_prodcom_products_db


#### 1. Products autocomplete endpoint
router = APIRouter(
    prefix="/api",
    tags=["common"],
)


@router.get("/products")
async def search_products(
    search: Optional[str] = None,
    product_type: str = Query("hs6_products", description="Product type: hs6_products or cn8_products"),
    type: Optional[str] = Query(None, description="Filter by product type"),
    limit: int = Query(50, le=100)
) -> List[dict]:
    """Returns products matching search term using embeddings similarity."""
    
    try:
        # Handle PRODCOM database queries separately for backward compatibility
        if product_type.lower() == "prodcom":
            return await search_prodcom_products_db(search, type, limit)
        
        # Validate product type
        if product_type not in ["hs6_products", "cn8_products"]:
            raise ValueError(f"Invalid product_type '{product_type}'. Must be 'hs6_products' or 'cn8_products'")
            
        return embedding_autocomplete(search, product_type, type, limit)
    
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Product search failed: {str(e)}")

#### 2. Countries autocomplete endpoint  
@router.get("/api/countries")
async def search_countries(
    search: Optional[str] = None,
    type: Optional[str] = Query(None, description="Filter by country type"),
    limit: int = Query(50, le=10000)
) -> List[dict]:
    """Returns countries matching search term using embeddings similarity."""
    
    try:
        return embedding_autocomplete(search, "countries", type, limit)
    
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Country search failed: {str(e)}")
