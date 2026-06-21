import pytest
from test_data.payloads import VALID_BOOKING_PAYLOAD


@pytest.fixture(scope="module")
def existing_booking_id(booking_api):
    response = booking_api.create_booking(VALID_BOOKING_PAYLOAD)
    assert response.status == 200
    return response.json()["bookingid"]


@pytest.mark.functional
def test_tc02_01_get_booking_by_valid_id(booking_api, existing_booking_id):
    response = booking_api.get_booking(existing_booking_id)
    assert response.status == 200, f"TC_02_01: Expected 200, got {response.status}"
    body = response.json()
    assert body["firstname"] == VALID_BOOKING_PAYLOAD["firstname"]
    assert body["lastname"] == VALID_BOOKING_PAYLOAD["lastname"]
    assert body["totalprice"] == VALID_BOOKING_PAYLOAD["totalprice"]
    assert body["bookingdates"]["checkin"] == VALID_BOOKING_PAYLOAD["bookingdates"]["checkin"]
    assert body["bookingdates"]["checkout"] == VALID_BOOKING_PAYLOAD["bookingdates"]["checkout"]


@pytest.mark.boundary
def test_tc02_02_get_bookings_boundary_date_range(booking_api):
    response = booking_api.get_all_bookings(params={
        "checkin": "2024-01-01",
        "checkout": "2024-12-31"
    })
    assert response.status == 200, f"TC_02_02: Expected 200, got {response.status}"
    body = response.json()
    assert isinstance(body, list), "TC_02_02: Response body must be a list"
