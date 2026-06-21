import json
from api.base_api import BaseAPI


class AuthAPI(BaseAPI):
    def __init__(self, context):
        super().__init__(context)

    def get_token(self) -> str:
        response = self.context.post(
            "/auth",
            data=json.dumps({"username": "admin", "password": "password123"})
        )
        assert response.status == 200, f"Auth failed with status: {response.status}"
        body = response.json()
        assert "token" in body, f"Token missing from auth response: {body}"
        return body["token"]
