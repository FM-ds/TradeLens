from pydantic import BaseModel, Field, validator
from typing import Optional, List


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
    quantity: float       # Quantity traded in metric tons
    unit: str            # Unit of measurement (typically "metric tons")

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