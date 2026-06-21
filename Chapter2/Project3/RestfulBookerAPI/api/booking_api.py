import json
from playwright.sync_api import APIRequestContext
from api.base_api import BaseAPI


class BookingAPI(BaseAPI):
    def __init__(self, context: APIRequestContext, token: str):
        super().__init__(context, token)

    def create_booking(self, payload: dict):
        return self.context.post("/booking", data=json.dumps(payload))

    def get_booking(self, booking_id: int):
        return self.context.get(f"/booking/{booking_id}")

    def get_all_bookings(self, params: dict = None):
        return self.context.get("/booking", params=params or {})

    def update_booking(self, booking_id: int, payload: dict):
        return self.context.put(
            f"/booking/{booking_id}",
            data=json.dumps(payload),
            headers=self._auth_headers()
        )

    def partial_update_booking(self, booking_id: int, payload: dict):
        return self.context.patch(
            f"/booking/{booking_id}",
            data=json.dumps(payload),
            headers=self._auth_headers()
        )

    def delete_booking(self, booking_id: int):
        return self.context.delete(
            f"/booking/{booking_id}",
            headers=self._auth_headers()
        )
