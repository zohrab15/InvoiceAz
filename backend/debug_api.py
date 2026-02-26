import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from users.models import User, Business
from invoices.models import Invoice
from django.test import RequestFactory
from invoices.views import InvoiceViewSet

user = User.objects.first()
business = Business.objects.filter(user=user).first()
print(f"User: {user.email}, Business: {business.name}")

factory = RequestFactory()
request = factory.get('/api/invoices/', HTTP_X_BUSINESS_ID=str(business.id))
request.user = user

view = InvoiceViewSet.as_view({'get': 'list'})
response = view(request)
print(f"Status: {response.status_code}")
print(f"Data: {response.data}")
