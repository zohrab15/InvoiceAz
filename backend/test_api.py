import os
import django
import sys
import json

# Setup Django environment
sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from users.models import User, Business
from rest_framework_simplejwt.tokens import RefreshToken

def test_api_view():
    email = 'demo_user@invoice.az'
    try:
        user = User.objects.get(email=email)
        token = RefreshToken.for_user(user).access_token
        
        print(f"User: {user.email}")
        print(f"Token: {str(token)[:20]}...")
        
        # Simulate /api/users/business/
        businesses = Business.objects.filter(user=user)
        print(f"Businesses count: {businesses.count()}")
        for b in businesses:
            print(f" - {b.name} (ID: {b.id}) | Active: {b.is_active}")
            
    except User.DoesNotExist:
        print("User not found")

if __name__ == "__main__":
    test_api_view()
