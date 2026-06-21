import pytest
from test_data.payloads import VALID_BOOKING_PAYLOAD, VALID_UPDATE_PAYLOAD


@pytest.fixture(scope="module")
def updatable_booking_id(booking_api):
    response = booking_api.create_booking(VALID_BOOKING_PAYLOAD)
    assert response.status == 200
    return response.json()["bookingid"]


@pytest.mark.functional
def test_tc03_01_update_booking_valid_data(booking_api, updatable_booking_id):
    response = booking_api.update_booking(updatable_booking_id, VALID_UPDATE_PAYLOAD)
    assert response.status == 200, f"TC_03_01: Expected 200, got {response.status}"
    body = response.json()
    assert body["firstname"] == VALID_UPDATE_PAYLOAD["firstname"]
    assert body["lastname"] == VALID_UPDATE_PAYLOAD["lastname"]
    assert body["totalprice"] == VALID_UPDATE_PAYLOAD["totalprice"]
    assert body["depositpaid"] == VALID_UPDATE_PAYLOAD["depositpaid"]
    assert body["bookingdates"]["checkin"] == VALID_UPDATE_PAYLOAD["bookingdates"]["checkin"]
    assert body["bookingdates"]["checkout"] == VALID_UPDATE_PAYLOAD["bookingdates"]["checkout"]


@pytest.mark.error_handling
def test_tc03_02_update_booking_invalid_id(booking_api):
    response = booking_api.update_booking(999999999, VALID_UPDATE_PAYLOAD)
    assert response.status in [403, 404, 405], (
        f"TC_03_02: Expected error status for invalid booking ID, got {response.status}"
    )
