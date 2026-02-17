import requests
import sys

API_URL = "http://localhost:8000/api"

def test_login():
    data = {
        "email": "demo@invoice.az",
        "password": "demo1234"
    }
    print(f"Testing login for {data['email']}...")
    try:
        response = requests.post(f"{API_URL}/auth/login/", json=data)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        if response.status_code == 200:
            print("Login Successful!")
        else:
            print("Login Failed!")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_login()
