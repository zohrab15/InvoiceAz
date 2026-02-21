import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.test import RequestFactory
from users.models import User, Business, TeamMember
from clients.models import Client
from clients.views import ClientViewSet

# 1. Create owner, sales rep, business, client
owner, _ = User.objects.get_or_create(email='owner@test.com', defaults={'password': 'pass', 'first_name': 'Owner'})
sales_rep, _ = User.objects.get_or_create(email='sales@test.com', defaults={'password': 'pass', 'first_name': 'Sales'})
business, _ = Business.objects.get_or_create(user=owner, defaults={'name': 'My Biz'})
TeamMember.objects.get_or_create(owner=owner, user=sales_rep, defaults={'role': 'SALES_REP'})

client_obj, _ = Client.objects.get_or_create(business=business, name='Test Client', defaults={'assigned_to': sales_rep})

print("Before Update:", client_obj.assigned_to.email if client_obj.assigned_to else "None")

# 2. Simulate Sales Rep PUT request (without assigned_to in payload)
factory = RequestFactory()
data = {
    'name': 'Test Client Updated',
    'business': business.id,
    'email': 'new@mail.com',
    'phone': '1234567890',
    'address': '',
    'voen': ''
}
request = factory.put(f'/clients/all/{client_obj.id}/', data, content_type='application/json')
request.user = sales_rep
request.headers = {'X-Business-ID': str(business.id)}

view = ClientViewSet.as_view({'put': 'update'})
response = view(request, pk=client_obj.id)

print("Response Status:", response.status_code)
if response.status_code != 200:
    print("Response Data:", response.data)

client_obj.refresh_from_db()
print("After Update:", client_obj.assigned_to.email if client_obj.assigned_to else "None")
