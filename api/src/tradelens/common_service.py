from fastapi import APIRouter, Query, HTTPException, Request
from typing import Optional, List
import logging

from tradelens.embedding import embedding_autocomplete
from tradelens.prodcom_service import search_prodcom_products_db


logger = logging.getLogger("tradelens.common_service")


router = APIRouter(
    prefix="/api",
    tags=["common"],
)


#### 1. Products autocomplete endpoint
@router.get("/products")
async def search_products(
    request: Request,
    search: Optional[str] = None,
    product_type: str = Query("hs6_products", description="Product type: hs6_products or cn8_products"),
    type: Optional[str] = Query(None, description="Filter by product type"),
    limit: int = Query(50, le=100)
) -> List[dict]:
    """Returns products matching search term using embeddings similarity."""

    logger.info(
        "Products search request: search=%r product_type=%s type=%r limit=%d",
        search, product_type, type, limit
    )

    model = request.app.state.embedding_model
    matrices = request.app.state.embedding_matrices
    data = request.app.state.embeddings_data

    try:
        # Handle PRODCOM database queries separately for backward compatibility
        if product_type.lower() == "prodcom":
            logger.info("Routing products search to PRODCOM handler")
            return await search_prodcom_products_db(search, type, limit)
        
        # Validate product type
        if product_type not in ["hs6_products", "cn8_products"]:
            logger.warning("Invalid product_type received: %s", product_type)
            raise ValueError(f"Invalid product_type '{product_type}'. Must be 'hs6_products' or 'cn8_products'")

        logger.info("Routing products search to embedding autocomplete")

        return embedding_autocomplete(
            search, product_type, data, model, matrices, type, limit)

    except Exception as e:
        logger.exception(
            "Product search failed: search=%r product_type=%s type=%r limit=%d",
            search, product_type, type, limit
        )
        raise HTTPException(status_code=400, detail=f"Product search failed: {str(e)}")

#### 2. Countries autocomplete endpoint  
@router.get("/countries")
async def search_countries(
    request: Request,
    search: Optional[str] = None,
    type: Optional[str] = Query(None, description="Filter by country type"),
    limit: int = Query(50, le=10000)
) -> List[dict]:
    """Returns countries matching search term using embeddings similarity."""

    logger.info(
        "Countries search request: search=%r type=%r limit=%d",
        search, type, limit
    )

    model = request.app.state.embedding_model
    matrices = request.app.state.embedding_matrices
    data = request.app.state.embeddings_data

    try:
        logger.info("Routing countries search to embedding autocomplete")
        return embedding_autocomplete(search, "countries", data, model, matrices, type, limit)
    
    except Exception as e:
        logger.exception(
            "Country search failed: search=%r type=%r limit=%d",
            search, type, limit
        )
        raise HTTPException(status_code=400, detail=f"Country search failed: {str(e)}")
