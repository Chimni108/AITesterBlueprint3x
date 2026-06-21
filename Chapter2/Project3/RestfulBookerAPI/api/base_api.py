from playwright.sync_api import APIRequestContext


class BaseAPI:
    def __init__(self, context: APIRequestContext, token: str = None):
        self.context = context
        self.token = token

    def _auth_headers(self) -> dict:
        if self.token:
            return {"Cookie": f"token={self.token}"}
        return {}
