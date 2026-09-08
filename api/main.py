from fastapi import FastAPI
import uvicorn
import json
import logging
import copy

from contextlib import asynccontextmanager
from uvicorn.config import LOGGING_CONFIG

from tradelens.app import get_app


logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s"
)
logger = logging.getLogger("tradelens.main")

APP_LOGGING_CONFIG = copy.deepcopy(LOGGING_CONFIG)
APP_LOGGING_CONFIG["disable_existing_loggers"] = False
APP_LOGGING_CONFIG["formatters"]["default"]["fmt"] = (
    "%(asctime)s | %(levelprefix)s | %(name)s | %(message)s"
)
APP_LOGGING_CONFIG["loggers"]["tradelens"] = {
    "handlers": ["default"],
    "level": "INFO",
    "propagate": False,
}

app = get_app()


# Define countries and products globally from locally saved data files
# Is this used by the front end? It doesn't seem to be used by the backend.
@asynccontextmanager
async def lifespan(app: FastAPI):
    # ---- Startup ----
    with open("data/shared/HS6_products.json") as f:
        app.state.PRODUCTS = json.load(f)

    with open("data/shared/countries.json") as f:
        app.state.COUNTRIES = json.load(f)

    yield

    # ---- Shutdown (optional cleanup) ----
    # e.g. close DB connections if needed


#### End point to define root
@app.get("/", tags=["root"])
async def read_root() -> dict:
    return {"message":"this is your root"}


if __name__ == "__main__":
    logger.info("Starting TradeLens API with auto-reload enabled")
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info",
        access_log=True,
        log_config=APP_LOGGING_CONFIG,
    )

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

