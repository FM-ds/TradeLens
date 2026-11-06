import pytest
from fastapi.testclient import TestClient
from unittest.mock import MagicMock, patch

from contextlib import asynccontextmanager

from tradelens.app import get_app


app = get_app()

client = TestClient(app)

duckdb_connection_patch = "tradelens.baci_service.duckdb.connect"
router_prefix = "/api/trade-query"


@patch(duckdb_connection_patch)
def test_query_trade_data_success(mock_connect):
    # --- Mock DuckDB connection ---
    mock_conn = MagicMock()
    mock_connect.return_value = mock_conn

    # First execute(): count query
    mock_conn.execute.return_value.fetchone.return_value = (1,)

    # Second execute(): data query
    mock_conn.execute.return_value.fetchall.return_value = [
        (
            "950300",            # product_code
            "Toys",              # product_description
            2021,                # year
            "840",               # importer_id
            "United States",     # importer_name
            "156",               # exporter_id
            "China",             # exporter_name
            "imports",           # trade_flow
            1000.0,              # value
            50.0,                # quantity
            "metric tons"        # unit
        )
    ]

    response = client.get(
        router_prefix,
        params={
            "trade_type": "imports",
            "product_codes": "950300",
            "from_country": "156",
            "to_country": "840",
            "year_from": 2020,
            "year_to": 2021,
            "page": 1,
            "page_size": 10,
        }
    )

    assert response.status_code == 200

    body = response.json()
    assert body["total_records"] == 1
    assert body["page"] == 1
    assert body["page_size"] == 10
    assert body["total_pages"] == 1
    assert isinstance(body["data"], list)
    assert len(body["data"]) == 1

    record = body["data"][0]
    assert record["product_code"] == "950300"
    assert record["product"] == "Toys"
    assert record["year"] == 2021
    assert record["trade_flow"] == "imports"
    assert record["value"] == 1000.0


def test_year_to_less_than_year_from():
    response = client.get(
        router_prefix,
        params={
            "year_from": 2022,
            "year_to": 2020
        }
    )

    assert response.status_code == 400
    assert response.json()["detail"] == "year_to must be >= year_from"


def test_empty_product_codes():
    response = client.get(
        router_prefix,
        params={
            "product_codes": "   "
        }
    )

    assert response.status_code == 400
    assert "product code" in response.json()["detail"].lower()


@patch(duckdb_connection_patch)
def test_pagination_calculation(mock_connect):
    mock_conn = MagicMock()
    mock_connect.return_value = mock_conn

    # Simulate 25 total records
    mock_conn.execute.return_value.fetchone.return_value = (25,)

    # Simulate page-sized results
    mock_conn.execute.return_value.fetchall.return_value = []

    response = client.get(
        router_prefix,
        params={
            "page": 2,
            "page_size": 10
        }
    )

    assert response.status_code == 200

    body = response.json()
    assert body["total_records"] == 25
    assert body["page"] == 2
    assert body["page_size"] == 10
    assert body["total_pages"] == 3

@patch(duckdb_connection_patch)
def test_world_aggregation(mock_connect):
    mock_conn = MagicMock()
    mock_connect.return_value = mock_conn

    mock_conn.execute.return_value.fetchone.return_value = (1,)
    mock_conn.execute.return_value.fetchall.return_value = [
        (
            "950300",
            "Toys",
            2021,
            "World",
            "imports",
            5000.0,
            200.0,
            "metric tons"
        )
    ]

    response = client.get(
        router_prefix,
        params={
            "to_country": "world",
            "trade_type": "imports"
        }
    )

    assert response.status_code == 200
    body = response.json()

    assert body["total_records"] == 1

@patch(duckdb_connection_patch)
def test_database_error_handling(mock_connect):
    mock_conn = MagicMock()
    mock_connect.return_value = mock_conn

    mock_conn.execute.side_effect = Exception("DuckDB failure")

    response = client.get(router_prefix)

    assert response.status_code == 400
    assert "Query failed" in response.json()["detail"]
