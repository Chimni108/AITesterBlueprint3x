import pytest
from test_data.payloads import VALID_BOOKING_PAYLOAD, MISSING_FIRSTNAME_PAYLOAD


@pytest.mark.functional
def test_tc01_01_create_booking_valid_data(booking_api):
    response = booking_api.create_booking(VALID_BOOKING_PAYLOAD)
    assert response.status == 200, f"TC_01_01: Expected 200, got {response.status}"
    body = response.json()
    assert "bookingid" in body, "TC_01_01: bookingid missing from response"
    assert body["booking"]["firstname"] == VALID_BOOKING_PAYLOAD["firstname"]
    assert body["booking"]["lastname"] == VALID_BOOKING_PAYLOAD["lastname"]
    assert body["booking"]["totalprice"] == VALID_BOOKING_PAYLOAD["totalprice"]
    assert body["booking"]["depositpaid"] == VALID_BOOKING_PAYLOAD["depositpaid"]
    assert body["booking"]["bookingdates"]["checkin"] == VALID_BOOKING_PAYLOAD["bookingdates"]["checkin"]
    assert body["booking"]["bookingdates"]["checkout"] == VALID_BOOKING_PAYLOAD["bookingdates"]["checkout"]


@pytest.mark.error_handling
def test_tc01_02_create_booking_missing_required_field(booking_api):
    response = booking_api.create_booking(MISSING_FIRSTNAME_PAYLOAD)
    assert response.status in [400, 500], (
        f"TC_01_02: Expected error status for missing firstname, got {response.status}"
    )
