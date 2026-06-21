import pytest
from test_data.payloads import VALID_BOOKING_PAYLOAD


@pytest.fixture(scope="module")
def deletable_booking_id(booking_api):
    response = booking_api.create_booking(VALID_BOOKING_PAYLOAD)
    assert response.status == 200
    return response.json()["bookingid"]


@pytest.mark.functional
def test_tc04_01_delete_booking_valid_id(booking_api, deletable_booking_id):
    delete_response = booking_api.delete_booking(deletable_booking_id)
    assert delete_response.status == 201, (
        f"TC_04_01: Expected 201 for successful delete, got {delete_response.status}"
    )
    get_response = booking_api.get_booking(deletable_booking_id)
    assert get_response.status == 404, (
        f"TC_04_01: Expected 404 after deletion, got {get_response.status}"
    )


@pytest.mark.error_handling
def test_tc04_02_delete_booking_nonexistent_id(booking_api):
    response = booking_api.delete_booking(999999999)
    assert response.status in [403, 404, 405], (
        f"TC_04_02: Expected error status for non-existent ID, got {response.status}"
    )
