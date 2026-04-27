from tradelens.data_models import TradeRecord, TradeDataResponse, ProdcomRecord

from fastapi import APIRouter, Query, HTTPException
from typing import List
from datetime import datetime
import duckdb

router = APIRouter(
    prefix="/api/trade-query",
    tags=["baci"],
)


#### 4. End point defining main BACI trade data query
@router.get("", response_model=TradeDataResponse)
async def query_trade_data(
    trade_type: str = Query("imports", regex="^(imports|exports|all)$"),
    product_codes: str = Query("950300", description="Comma-separated product codes"),
    from_country: str = Query("156", description="Origin country"),
    to_country: str = Query("everywhere", description="Destination country"),
    year_from: int = Query(2020, ge=2000, le=2024),
    year_to: int = Query(2022, ge=2000, le=2024),
    page: int = Query(1, ge=1),
    page_size: int = Query(100, ge=10, le=10000)
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
                    'metric tons' as unit
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
                    'metric tons' as unit
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
                CAST(exporter AS VARCHAR) as exporter_id,
                CAST(exporter_name AS VARCHAR) as exporter_name,
                ? as trade_flow,
                value as value,
                quantity as quantity,
                'metric tons' as unit  
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
                    unit=str(row[10]) if row[10] is not None else "metric tons" 
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
