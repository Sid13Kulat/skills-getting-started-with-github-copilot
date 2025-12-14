from copy import deepcopy

import pytest
from fastapi.testclient import TestClient

from src import app as app_module


client = TestClient(app_module.app)


@pytest.fixture(autouse=True)
def reset_activities():
    # Preserve the in-memory activities and restore after each test
    original = deepcopy(app_module.activities)
    yield
    app_module.activities.clear()
    app_module.activities.update(deepcopy(original))


def test_get_activities():
    resp = client.get("/activities")
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, dict)
    # Expect known activity from the seed data
    assert "Chess Club" in data


def test_signup_and_unregister_flow():
    activity = "Basketball Team"
    email = "tester@example.com"

    # Ensure initially not present
    resp = client.get("/activities")
    assert resp.status_code == 200
    assert email not in resp.json()[activity]["participants"]

    # Sign up
    resp = client.post(f"/activities/{activity}/signup", params={"email": email})
    assert resp.status_code == 200
    assert "Signed up" in resp.json().get("message", "")

    # Confirm present
    resp = client.get("/activities")
    assert email in resp.json()[activity]["participants"]

    # Unregister
    resp = client.delete(f"/activities/{activity}/unregister", params={"email": email})
    assert resp.status_code == 200
    assert "Unregistered" in resp.json().get("message", "")

    # Confirm removed
    resp = client.get("/activities")
    assert email not in resp.json()[activity]["participants"]
