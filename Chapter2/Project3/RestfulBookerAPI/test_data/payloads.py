VALID_BOOKING_PAYLOAD = {
    "firstname": "Jim",
    "lastname": "Brown",
    "totalprice": 111,
    "depositpaid": True,
    "bookingdates": {
        "checkin": "2024-01-01",
        "checkout": "2024-01-10"
    },
    "additionalneeds": "Breakfast"
}

MISSING_FIRSTNAME_PAYLOAD = {
    "lastname": "Brown",
    "totalprice": 111,
    "depositpaid": True,
    "bookingdates": {
        "checkin": "2024-01-01",
        "checkout": "2024-01-10"
    }
}

VALID_UPDATE_PAYLOAD = {
    "firstname": "James",
    "lastname": "Smith",
    "totalprice": 200,
    "depositpaid": False,
    "bookingdates": {
        "checkin": "2024-02-01",
        "checkout": "2024-02-10"
    },
    "additionalneeds": "Lunch"
}

BOUNDARY_BOOKING_PAYLOAD = {
    "firstname": "A" * 100,
    "lastname": "B" * 100,
    "totalprice": 999999,
    "depositpaid": True,
    "bookingdates": {
        "checkin": "2024-01-01",
        "checkout": "2024-12-31"
    },
    "additionalneeds": "All inclusive"
}
