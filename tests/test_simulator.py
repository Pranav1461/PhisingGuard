from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

def test_simulator_flow_and_privacy():
    # 1. Create Session
    session_res = client.post("/api/simulator/session", json={"target_email": "testuser@example.test"})
    assert session_res.status_code == 200
    session_data = session_res.json()
    session_id = session_data["session_id"]
    assert session_id.startswith("sim-")

    # 2. Record Event (STRICT BOOLEAN ONLY)
    event_payload = {
        "session_id": session_id,
        "event_type": "login_submitted",
        "username_entered": "testuser@example.test",
        "password_entered": True
    }
    event_res = client.post("/api/simulator/events", json=event_payload)
    assert event_res.status_code == 200
    event_data = event_res.json()
    assert event_data["password_entered"] is True

    # 3. Verify Latest Event Endpoint
    latest_res = client.get("/api/simulator/events/latest")
    assert latest_res.status_code == 200
    latest_data = latest_res.json()
    assert latest_data["has_events"] is True
    assert latest_data["latest_event"]["password_entered"] is True

    # 4. PRIVACY CHECK: Verify raw password parameter IS REJECTED
    forbidden_payload = {
        "session_id": session_id,
        "event_type": "login_submitted",
        "username_entered": "testuser@example.test",
        "password": "MySuperSecretPassword123!", # FORBIDDEN RAW STRING
        "password_entered": True
    }
    forbidden_res = client.post("/api/simulator/events", json=forbidden_payload)
    assert forbidden_res.status_code == 422 # Pydantic Validation Error

    # 5. Reset Simulator
    reset_res = client.post("/api/simulator/reset")
    assert reset_res.status_code == 200
    assert reset_res.json()["status"] == "success"
