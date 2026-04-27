
from fastapi import APIRouter, Query, HTTPException
from typing import Optional, List
import duckdb
import datetime

from tradelens.data_models import ProdcomRecord, ProdcomDataResponse


router = APIRouter(
    prefix="/api/prodcom",
    tags=["prodcom"],
)

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
@router.get("/products")
async def search_prodcom_products(
    search: Optional[str] = None,
    limit: int = Query(50, le=100)
) -> List[dict]:
    """DEPRECATED: Use /api/products?nomenclature=PRODCOM instead."""
    return await search_prodcom_products_db(search, None, limit)


#### 5. End point for PRODCOM manufacturer sales data query
@router.get("-query", response_model=ProdcomDataResponse)
async def query_prodcom_data(
    product_codes: str = Query("16211529", description="Comma-separated product codes"),
    year_from: int = Query(2020, ge=2014, le=2024),
    year_to: int = Query(2024, ge=2014, le=2024),
    measure: str = Query("Value", regex="^(Value|Volume|Other)$", description="Data measure type"),
    page: int = Query(1, ge=1),
    page_size: int = Query(100, ge=10, le=10000)
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