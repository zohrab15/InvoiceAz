import requests

def check_media_api():
    base_url = 'http://localhost:8000'
    login_url = f"{base_url}/api/auth/login/"
    
    # Login as demo
    data = {
        'email': 'demo_user@invoice.az',
        'password': 'demopassword123'
    }
    
    response = requests.post(login_url, json=data)
    if response.status_code == 200:
        res_data = response.data if hasattr(response, 'data') else response.json()
        user = res_data.get('user', {})
        print(f"User Avatar from Login API: {user.get('avatar')}")
        
        token = res_data.get('access') or res_data.get('access_token') or res_data.get('key')
        headers = {'Authorization': f'Bearer {token}'} if 'access' in res_data or 'access_token' in res_data else {'Authorization': f'Token {token}'}
        
        # Check businesses
        biz_res = requests.get(f"{base_url}/api/users/business/", headers=headers)
        if biz_res.status_code == 200:
            businesses = biz_res.json()
            if businesses:
                print(f"Business Logo from API: {businesses[0].get('logo')}")
    else:
        print(f"Failed to login: {response.status_code}")

if __name__ == "__main__":
    check_media_api()
