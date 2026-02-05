from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_health_endpoint():
	response = client.get("/api/health")
	assert response.status_code == 200
	payload = response.json()
	assert payload.get("status") == "healthy"

def test_provinces_endpoint():
	response = client.get("/api/provinces")
	assert response.status_code == 200
	payload = response.json()
	assert "provinces" in payload
	assert "total" in payload

def test_snapshot_rejects_future_date():
	response = client.get("/api/weather/snapshot", params={"date": "2999-01-01", "time": "12:00"})
	assert response.status_code == 400
