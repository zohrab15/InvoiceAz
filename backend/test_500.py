import requests
import json

API_URL = "http://localhost:8000/api"

def test_login_500():
    data = {
        "email": "demo_user@invoice.az",
        "password": "demopassword123"
    }
    print(f"Testing login for {data['email']} to catch 500...")
    try:
        response = requests.post(f"{API_URL}/auth/login/", json=data)
        print(f"Status Code: {response.status_code}")
        try:
            print(f"Response JSON: {json.dumps(response.json(), indent=2)}")
        except:
            print(f"Response Text: {response.text[:500]}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_login_500()
