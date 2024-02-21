from fastapi.testclient import TestClient

from main import app

client = TestClient(app)

root_response = {
    "api_version": "0.1",
    "status": "live",
    "api_documentation_path": "/docs"
}

def test_read_root():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == root_response

def test_read_health_check():
    response = client.get("/health")
    assert response.status_code == 200