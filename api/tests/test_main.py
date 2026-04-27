from fastapi import FastAPI
from fastapi.testclient import TestClient


from main import app

fake_db = {
    "0" : {"year": 2022, "exporter": "123", "importer": "456", "product": "123456", "value" : "100", "quantity" :"101", "exporter_name" : "name_1", "importer_name" : "name_2", "product_description" : "description 1"},
    "1" : {"year": 2023, "exporter": "123", "importer": "456", "product": "123456", "value" : "102", "quantity" :"102", "exporter_name" : "name_1", "importer_name" : "name_2", "product_description" : "description 1"},
    "2" : {"year": 2022, "exporter": "456", "importer": "123", "product": "123456", "value" : "103", "quantity" :"103", "exporter_name" : "name_2", "importer_name" : "name_1", "product_description" : "description 1"},
    "3" : {"year": 2023, "exporter": "456", "importer": "123", "product": "123456", "value" : "104", "quantity" :"104", "exporter_name" : "name_2", "importer_name" : "name_1", "product_description" : "description 1"},
}

client = TestClient(app)

def test_read_main():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"message": "this is your root"}

def test_query_trade_data():
    response = client.get("/api/trade-query")