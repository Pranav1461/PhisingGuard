from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

def test_simulator_templates_endpoint():
    res = client.get("/api/simulator/templates")
    assert res.status_code == 200
    templates = res.json()
    assert isinstance(templates, list)
    assert len(templates) >= 3
    ids = [t["id"] for t in templates]
    assert "nordvault-security" in ids
    assert "storage-quota" in ids

def test_simulator_email_dispatch_and_history():
    # 1. Dispatch Email (Simulated or Resend)
    dispatch_payload = {
        "target_email": "student.test@example.com",
        "template_id": "nordvault-security"
    }
    dispatch_res = client.post("/api/simulator/send-email", json=dispatch_payload)
    assert dispatch_res.status_code == 200
    data = dispatch_res.json()
    assert data["success"] is True
    assert data["session_id"].startswith("sim-")
    assert "simulator?session_id=" in data["tracking_url"]
    session_id = data["session_id"]

    # 2. Record Link Clicked Event
    click_payload = {
        "session_id": session_id,
        "event_type": "link_clicked",
        "username_entered": "student.test@example.com",
        "password_entered": False
    }
    click_res = client.post("/api/simulator/events", json=click_payload)
    assert click_res.status_code == 200

    # 3. Check Session Detail
    session_detail_res = client.get(f"/api/simulator/sessions/{session_id}")
    assert session_detail_res.status_code == 200
    detail = session_detail_res.json()
    assert detail["session_id"] == session_id
    assert detail["status"] == "clicked"
    assert len(detail["events"]) >= 2  # email_sent + link_clicked

    # 4. Record Login Submitted Event
    submit_payload = {
        "session_id": session_id,
        "event_type": "login_submitted",
        "username_entered": "student.test@example.com",
        "password_entered": True,
        "password_value": "dummyPassword123"
    }
    submit_res = client.post("/api/simulator/events", json=submit_payload)
    assert submit_res.status_code == 200

    # 5. Check Sessions List
    sessions_list_res = client.get("/api/simulator/sessions")
    assert sessions_list_res.status_code == 200
    sessions_list = sessions_list_res.json()
    assert len(sessions_list) >= 1
    assert any(s["session_id"] == session_id for s in sessions_list)

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

    # 4. Reset Simulator
    reset_res = client.post("/api/simulator/reset")
    assert reset_res.status_code == 200
    assert reset_res.json()["status"] == "success"
