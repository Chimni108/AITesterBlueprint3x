import pytest
from playwright.sync_api import sync_playwright
from api.auth_api import AuthAPI
from api.booking_api import BookingAPI

BASE_URL = "https://restful-booker.herokuapp.com"


@pytest.fixture(scope="session")
def api_context():
    with sync_playwright() as p:
        context = p.request.new_context(
            base_url=BASE_URL,
            extra_http_headers={
                "Content-Type": "application/json",
                "Accept": "application/json"
            }
        )
        yield context
        context.dispose()


@pytest.fixture(scope="session")
def auth_token(api_context):
    return AuthAPI(api_context).get_token()


@pytest.fixture(scope="session")
def booking_api(api_context, auth_token):
    return BookingAPI(api_context, auth_token)
