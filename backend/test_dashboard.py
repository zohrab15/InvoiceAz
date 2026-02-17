import os
import django
import sys
from decimal import Decimal

# Setup Django environment
sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from users.models import User, Business
from invoices.views import InvoiceViewSet
from rest_framework.test import APIRequestFactory, force_authenticate

def test_dashboard_logic():
    email = 'demo_user@invoice.az'
    try:
        user = User.objects.get(email=email)
        business = Business.objects.filter(user=user).first()
        
        if not business:
            print("No business found for demo user")
            return

        print(f"Testing for User: {user.email}, Business ID: {business.id}")
        
        factory = APIRequestFactory()
        # Mock the dashboard request to /api/invoices/
        request = factory.get('/api/invoices/', **{'HTTP_X_BUSINESS_ID': str(business.id)})
        force_authenticate(request, user=user)
        
        view = InvoiceViewSet.as_view({'get': 'list'})
        response = view(request)
        
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            print(f"Invoices returned: {len(response.data)}")
            if len(response.data) > 0:
                print(f"First invoice total: {response.data[0]['total']}")
        else:
            print(f"Error data: {response.data}")
            
    except User.DoesNotExist:
        print("User not found")

if __name__ == "__main__":
    test_dashboard_logic()
