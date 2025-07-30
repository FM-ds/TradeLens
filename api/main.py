from fastapi import FastAPI, Request, Form, HTTPException, Query
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
import duckdb
import pandas as pd
import time
import uvicorn

from pydantic import BaseModel, Field, validator
from typing import Optional, List, Literal
from datetime import datetime
import json
from fastapi.middleware.cors import CORSMiddleware
from sentence_transformers import SentenceTransformer
import numpy as np

app = FastAPI()

# Add Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Define countries and products globally from locally saved data files
with open("data/shared/HS6_products.json", "r") as f:
    PRODUCTS = json.load(f)
with open("data/shared/countries.json", "r") as f:
    COUNTRIES = json.load(f)

# Load embeddings with metadata - organized by product type
EMBEDDINGS_DATA = {
    "countries": [],
    "hs6_products": [],
    "cn8_products": []
}

# Load embeddings
try:
    with open("data/shared/country_embeddings.json", "r") as f:
        EMBEDDINGS_DATA["countries"] = json.load(f)
    with open("data/shared/HS6_product_embeddings.json", "r") as f:
        EMBEDDINGS_DATA["hs6_products"] = json.load(f)
    with open("data/shared/cn8_division_industry_product_embeddings.json", "r") as f:
        EMBEDDINGS_DATA["cn8_products"] = json.load(f)
except FileNotFoundError as e:
    print(f"Warning: Could not load embeddings: {e}")

# Load embedding model once
EMBEDDING_MODEL = SentenceTransformer('all-MiniLM-L6-v2')

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

EMBEDDING_MATRICES = build_embedding_matrices()

# Model to define a trade data record object - this will move to a separate model folder
class TradeRecord(BaseModel):
    """Individual trade data record."""
    product_code: str      # HS/CN8 product code
    product: str      # Product description
    year: int             # Trade year
    # partner: str          # Trading partner country
    exporter_name: str
    exporter_id: int
    importer_name: str
    importer_id: int
    trade_flow: str       # "imports" or "exports"
    value: float          # Trade value in USD
    quantity: float       # Quantity traded
    unit: str            # Unit of measurement (typically "kg")

# Model to define a trade query response meta-data object - this will move to a separate model folder
class TradeDataResponse(BaseModel):
    """Structured trade data response."""
    total_records: int          # Total number of matching records
    page: int                   # Current page number
    page_size: int             # Records per page
    total_pages: int           # Total pages available
    data: List[TradeRecord]    # Array of trade records for current page
    execution_time_ms: float   # Query execution time in milliseconds

# Model to define a PRODCOM data record object
class ProdcomRecord(BaseModel):
    """Individual PRODCOM manufacturer sales record."""
    code: str                  # Product code
    description: str           # Product description
    year: int                  # Data year
    measure: str               # Value, Volume, or Other
    value: float               # The actual value
    unit: str                  # Unit of measurement
    flag: Optional[str]        # Data flag if any

# Model to define a PRODCOM query response meta-data object
class ProdcomDataResponse(BaseModel):
    """Structured PRODCOM data response."""
    total_records: int          # Total number of matching records
    page: int                   # Current page number
    page_size: int             # Records per page
    total_pages: int           # Total pages available
    data: List[ProdcomRecord]  # Array of PRODCOM records for current page
    execution_time_ms: float   # Query execution time in milliseconds

#### End point to define root
@app.get("/", tags=["root"])
async def read_root() -> dict:
    return {"message":"this is your root"}

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
    
    # Perform similarity search
    search_emb = EMBEDDING_MODEL.encode([search_term])[0]
    norms = np.linalg.norm(embedding_matrix, axis=1) * np.linalg.norm(search_emb)
    scores = np.dot(embedding_matrix, search_emb) / norms
    top_idx = np.argsort(scores)[::-1][:limit]
    
    return [
        {k: v for k, v in items_data[i].items() if k != "embedding"}
        for i in top_idx
    ]

#### 1. Products autocomplete endpoint
@app.get("/api/products")
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
@app.get("/api/countries")
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

#### Helper function for PRODCOM products (database-based)
async def search_prodcom_products_db(
    search: Optional[str] = None,
    type_filter: Optional[str] = None,
    limit: int = 50
) -> List[dict]:
    """Search PRODCOM products from database."""
    
    conn = duckdb.connect()
    
    try:
        # Build base query
        base_query = """
        SELECT DISTINCT code, description, type
        FROM 'data/prodcom/prodcom.parquet' 
        WHERE description IS NOT NULL
        """
        params = []
        
        # Add type filter if specified
        if type_filter:
            base_query += " AND type = ?"
            params.append(type_filter)
        
        if not search:
            # Return a sample of products if no search term
            query = base_query + " ORDER BY code LIMIT ?"
            params.append(limit)
        else:
            # Search by description or code
            query = base_query + """
            AND (LOWER(description) LIKE LOWER(?) OR code LIKE ?)
            ORDER BY 
                CASE WHEN code LIKE ? THEN 1 ELSE 2 END,
                LENGTH(description),
                code
            LIMIT ?
            """
            search_pattern = f"%{search}%"
            code_pattern = f"{search}%"
            params.extend([search_pattern, code_pattern, code_pattern, limit])
        
        result = conn.execute(query, params).fetchall()
        
        return [
            {
                "code": str(row[0]),
                "name": str(row[1]),
                "description": str(row[1]),
                "type": str(row[2]) if len(row) > 2 and row[2] else None
            }
            for row in result
        ]
        
    finally:
        conn.close()

#### 3. End point to return searched PRODCOM products (for PRODCOM dataset) - DEPRECATED
@app.get("/api/prodcom/products")
async def search_prodcom_products(
    search: Optional[str] = None,
    limit: int = Query(50, le=100)
) -> List[dict]:
    """DEPRECATED: Use /api/products?nomenclature=PRODCOM instead."""
    return await search_prodcom_products_db(search, None, limit)


#### 4. End point defining main BACI trade data query
@app.get("/api/trade-query", response_model=TradeDataResponse)
async def query_trade_data(
    trade_type: str = Query("imports", regex="^(imports|exports|all)$"),
    product_codes: str = Query("950300", description="Comma-separated product codes"),
    from_country: str = Query("156", description="Origin country"),
    to_country: str = Query("everywhere", description="Destination country"),
    year_from: int = Query(2020, ge=2000, le=2024),
    year_to: int = Query(2022, ge=2000, le=2024),
    page: int = Query(1, ge=1),
    page_size: int = Query(100, ge=10, le=1000)
):
    """Returns trade data based on query parameters."""
    
    start_time = datetime.now()
    
    if year_to < year_from:
        raise HTTPException(status_code=400, detail="year_to must be >= year_from")
    
    product_list = [code.strip() for code in product_codes.split(",") if code.strip()]
    if not product_list:
        raise HTTPException(status_code=400, detail="At least one product code required")
    
    # Parse country codes 
    from_country_list = [code.strip() for code in from_country.split(",") if code.strip() and code.strip() not in ["everywhere", "world"]]
    to_country_list = [code.strip() for code in to_country.split(",") if code.strip() and code.strip() not in ["everywhere", "world"]]
    
    try:
        # "world" means aggregate across all partners
        aggregate_data = to_country == "world"
        
        params = []
        
        if aggregate_data:
            # Aggregated query - sum across all partners for the specified country
            if trade_type == "exports":
                # For exports to world: sum all importers for the exporting country
                select_clause = """
                SELECT 
                    CAST(product AS VARCHAR) as product_code,
                    ANY_VALUE(product_description) as product_description,
                    year,
                    'World' as partner,
                    ? as trade_flow,
                    SUM(value) as value,
                    SUM(quantity) as quantity,
                    'kg' as unit
                """
                group_clause = "GROUP BY product, year"
            else:
                # For imports from world: sum all exporters to the importing country  
                select_clause = """
                SELECT 
                    CAST(product AS VARCHAR) as product_code,
                    ANY_VALUE(product_description) as product_description,
                    year,
                    'World' as partner,
                    ? as trade_flow,
                    SUM(value) as value,
                    SUM(quantity) as quantity,
                    'kg' as unit
                """
                group_clause = "GROUP BY product, year"
                
            params.append(trade_type)
            
        else:
            select_clause = f""" 
            SELECT 
                CAST(product AS VARCHAR) as product_code,
                product_description,
                year,
                CAST(importer AS VARCHAR) as importer_id,
                CAST(importer_name AS VARCHAR) as importer_name,
                CAST(exporter AS VARCHAR) as importer_id,
                CAST(exporter_name AS VARCHAR) as exporter_name,
                ? as trade_flow,
                value as value,
                quantity as quantity,
                'kg' as unit  
            """
            params.append(trade_type)
            group_clause = ""
        
        # Build WHERE conditions
        where_conditions = []
        
        # Year filter  
        where_conditions.append("year BETWEEN ? AND ?")
        params.extend([year_from, year_to])
        
        # Product codes
        product_placeholders = ",".join(["?" for _ in product_list])
        where_conditions.append(f"CAST(product AS VARCHAR) IN ({product_placeholders})")
        params.extend(product_list)
        
        if from_country not in ["everywhere", "world"] and from_country_list:
            from_placeholders = ",".join(["?" for _ in from_country_list])
            where_conditions.append(f"CAST(exporter AS VARCHAR) IN ({from_placeholders})")
            params.extend(from_country_list)
            
        if not aggregate_data and to_country not in ["everywhere", "world"] and to_country_list:
            to_placeholders = ",".join(["?" for _ in to_country_list])
            where_conditions.append(f"CAST(importer AS VARCHAR) IN ({to_placeholders})")
            params.extend(to_country_list)
        
        else:  # trade_type == "all"
            # For "all": include both import and export flows
            if from_country not in ["everywhere", "world"] and from_country_list:
                from_placeholders = ",".join(["?" for _ in from_country_list])
                where_conditions.append(f"(CAST(exporter AS VARCHAR) IN ({from_placeholders}) OR CAST(importer AS VARCHAR) IN ({from_placeholders}))")
                params.extend(from_country_list * 2)  # Need params twice for OR condition
            
            if not aggregate_data and to_country not in ["everywhere", "world"] and to_country_list:
                to_placeholders = ",".join(["?" for _ in to_country_list])
                where_conditions.append(f"(CAST(importer AS VARCHAR) IN ({to_placeholders}) OR CAST(exporter AS VARCHAR) IN ({to_placeholders}))")
                params.extend(to_country_list * 2)  # Need params twice for OR condition
        
        # Complete queries
        base_from = "FROM 'data/BACI/baci_hs17_2017_2022.parquet'"
        where_clause = f"WHERE {' AND '.join(where_conditions)}" if where_conditions else ""
        
        # Count query
        if group_clause:
            count_query = f"""
            SELECT COUNT(*) as total FROM (
                SELECT 1 {base_from} {where_clause} {group_clause}
            ) subq
            """
            #count_params = params[1:]
        else:
            count_query = f"SELECT COUNT(*) as total {base_from} {where_clause}"
        
        # Remove trade_flow parameter for count query (it's only used in SELECT)
        count_params = params[1:]
        
        # Data query
        offset = (page - 1) * page_size
        data_query = f"""
        {select_clause}
        {base_from}
        {where_clause}
        {group_clause}
        ORDER BY year DESC, value DESC
        LIMIT ? OFFSET ?
        """
        
        conn = duckdb.connect()
        
        # Use a separate params list for count and data queries
        data_params = list(params) + [page_size, offset]  # Add LIMIT and OFFSET for data query
        
        total_result = conn.execute(count_query, count_params).fetchone()
        total_records = total_result[0] if total_result else 0
        
        data_result = conn.execute(data_query, data_params).fetchall()
        
        conn.close()
        
        data = []
        for row in data_result:
            try:
                product_code = str(row[0]) if row[0] is not None else ""
                product_description = str(row[1]) if row[1] is not None else f"Product {product_code}"
                 
                trade_record = TradeRecord(
                    product_code=product_code,
                    product=product_description,
                    year=int(row[2]) if row[2] is not None else 0, 
                    importer_id=str(row[3]) if row[3] is not None else "",
                    importer_name=str(row[4]) if row[4] is not None else "",
                    exporter_id=str(row[5]) if row[5] is not None else "",
                    exporter_name=str(row[6]) if row[6] is not None else "",
                    trade_flow=str(row[7]) if row[7] is not None else "",
                    value=float(row[8]) if row[8] is not None else 0.0,
                    quantity=float(row[9]) if row[9] is not None else 0.0,
                    unit=str(row[10]) if row[10] is not None else "KG Tonnes" 
                )
                data.append(trade_record)
            except (IndexError, ValueError, TypeError) as e:
                print(f"Error converting row {row}: {e}")
                continue
        
        # Time the query for performance analysis
        execution_time = (datetime.now() - start_time).total_seconds() * 1000
        total_pages = (total_records + page_size - 1) // page_size
        
        return TradeDataResponse(
            total_records=total_records,
            page=page,
            page_size=page_size,
            total_pages=total_pages,
            data=data,
            execution_time_ms=round(execution_time, 2)
        )

    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Query failed: {str(e)}")


#### 5. End point for PRODCOM manufacturer sales data query
@app.get("/api/prodcom-query", response_model=ProdcomDataResponse)
async def query_prodcom_data(
    product_codes: str = Query("16211529", description="Comma-separated product codes"),
    year_from: int = Query(2020, ge=2014, le=2024),
    year_to: int = Query(2024, ge=2014, le=2024),
    measure: str = Query("Value", regex="^(Value|Volume|Other)$", description="Data measure type"),
    page: int = Query(1, ge=1),
    page_size: int = Query(100, ge=10, le=1000)
):
    """Returns PRODCOM manufacturer sales data based on query parameters."""
    
    start_time = datetime.now()
    
    if year_to < year_from:
        raise HTTPException(status_code=400, detail="year_to must be >= year_from")
    
    product_list = [code.strip() for code in product_codes.split(",") if code.strip()]
    if not product_list:
        raise HTTPException(status_code=400, detail="At least one product code required")
    
    try:
        # Map measure parameter to database measure values
        measure_mapping = {
            "Value": "Value",
            "Volume": "Volume", 
            "Other": "Average price/Other"
        }
        db_measure = measure_mapping[measure]
        
        # Build parameters list
        params = []
        
        # Build WHERE conditions
        where_conditions = []
        
        # Year filter with explicit casting
        where_conditions.append("CAST(year AS INTEGER) BETWEEN ? AND ?")
        params.extend([year_from, year_to])
        
        # Product codes filter
        product_placeholders = ",".join(["?" for _ in product_list])
        where_conditions.append(f"code IN ({product_placeholders})")
        params.extend(product_list)
        
        # Measure filter
        where_conditions.append("measure = ?")
        params.append(db_measure)
        
        # Build queries
        base_from = "FROM 'data/prodcom/prodcom.parquet'"
        where_clause = f"WHERE {' AND '.join(where_conditions)}"
        
        # Count query
        count_query = f"SELECT COUNT(*) as total {base_from} {where_clause}"
        
        # Data query
        offset = (page - 1) * page_size
        data_query = f"""
        SELECT 
            code,
            description,
            year,
            measure,
            value,
            unit,
            flag
        {base_from}
        {where_clause}
        ORDER BY CAST(year AS INTEGER) DESC, value DESC
        LIMIT ? OFFSET ?
        """
        
        conn = duckdb.connect()
        
        # Execute queries
        data_params = list(params) + [page_size, offset]
        
        total_result = conn.execute(count_query, params).fetchone()
        total_records = total_result[0] if total_result else 0
        
        data_result = conn.execute(data_query, data_params).fetchall()
        
        conn.close()
        
        # Convert results
        data = [
            ProdcomRecord(
                code=str(row[0]),
                description=str(row[1]),
                year=int(row[2]) if row[2] else 0,
                measure=row[3],
                value=float(row[4]) if row[4] else 0.0,
                unit=str(row[5]) if row[5] else "",
                flag=str(row[6]) if row[6] else None
            )
            for row in data_result
        ]
        
        # Calculate execution time and pagination
        execution_time = (datetime.now() - start_time).total_seconds() * 1000
        total_pages = (total_records + page_size - 1) // page_size
        
        return ProdcomDataResponse(
            total_records=total_records,
            page=page,
            page_size=page_size,
            total_pages=total_pages,
            data=data,
            execution_time_ms=round(execution_time, 2)
        )

    except Exception as e:
        raise HTTPException(status_code=400, detail=f"PRODCOM query failed: {str(e)}")


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

# ------------------
#  OLD QUERY NOTES, POSSIBLY USEFUL FOR TESTING
    
# @app.post("/query", response_class=HTMLResponse)
# async def run_query(
#     request: Request,
#     query_type: str = Form(...),
#     exporter: int = Form(...),
#     importer: int = Form(None),
#     product: int = Form(...),
#     year_from: int = Form(...),
#     year_to: int = Form(...)
# ):
#     start_time = time.time()

#     if query_type == "1":
#         query = f"""
#             SELECT * FROM 'data/BACI/baci_hs17_2017_2022.parquet'
#             WHERE exporter = {exporter}
#               AND importer = {importer}
#               AND product = {product}
#               AND year BETWEEN {year_from} AND {year_to}
#             LIMIT 100
#         """
#     elif query_type == "2":
#         query = f"""
#             SELECT year, importer, SUM(value) AS total_value
#             FROM 'data/BACI/baci_hs17_2017_2022.parquet'
#             WHERE exporter = {exporter}
#               AND product = {product}
#               AND year BETWEEN {year_from} AND {year_to}
#             GROUP BY year, importer
#             ORDER BY year, total_value DESC
#             LIMIT 100
#         """
#     elif query_type == "3":
#         query = f"""
#             SELECT product, SUM(value) AS total_value
#             FROM 'data/BACI/baci_hs17_2017_2022.parquet'
#             WHERE exporter = {exporter}
#             GROUP BY product
#             ORDER BY total_value DESC
#             LIMIT 20
#         """
#     elif query_type == "4":
#         query = f"""
#             SELECT importer, SUM(value) AS total_value
#             FROM 'data/BACI/baci_hs17_2017_2022.parquet'
#             WHERE exporter = {exporter}
#               AND year BETWEEN {year_from} AND {year_to}
#             GROUP BY importer
#             ORDER BY total_value DESC
#             LIMIT 50
#         """
#     elif query_type == "5":
#         query = f"""
#             WITH yearly_totals AS (
#                 SELECT importer, product, year, SUM(value) AS total_value
#                 FROM 'data/BACI/baci_hs17_2017_2022.parquet'
#                 WHERE exporter = {exporter}
#                   AND year IN (2017, 2022)
#                 GROUP BY importer, product, year
#             ),
#             pivoted AS (
#                 SELECT 
#                     importer,
#                     product,
#                     MAX(CASE WHEN year = 2017 THEN total_value ELSE NULL END) AS value_2017,
#                     MAX(CASE WHEN year = 2022 THEN total_value ELSE NULL END) AS value_2022
#                 FROM yearly_totals
#                 GROUP BY importer, product
#             ),
#             differences AS (
#                 SELECT importer, product, value_2017, value_2022,
#                        ROUND(100.0 * (value_2022 - value_2017) / value_2017, 2) AS pct_growth
#                 FROM pivoted
#                 WHERE value_2017 IS NOT NULL AND value_2022 IS NOT NULL AND value_2017 >= 1000
#             )
#             SELECT *
#             FROM differences
#             ORDER BY pct_growth DESC
#             LIMIT 10
#         """
#     else:
#         query = "SELECT 1"

#     df = duckdb.query(query).to_df()
#     elapsed = round(time.time() - start_time, 3)
#     table_html = df.to_html(index=False)

#     return templates.TemplateResponse("form.html", {
#         "request": request,
#         "table": table_html,
#         "elapsed": elapsed,
#         "form_data": {
#             "query_type": query_type,
#             "exporter": exporter,
#             "importer": importer if importer is not None else '',
#             "product": product,
#             "year_from": year_from,
#             "year_to": year_to,
#         }
#     })

