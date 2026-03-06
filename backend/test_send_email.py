import os
import django
import sys

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from invoices.models import Invoice
from invoices.views import InvoiceViewSet
from rest_framework.test import APIRequestFactory, force_authenticate

invoice = Invoice.objects.filter(client__email__isnull=False).exclude(client__email='').first()

if not invoice:
    print("No invoices with client email found.")
    sys.exit()

print(f"Testing send_email for invoice: {invoice.invoice_number} to {invoice.client.email}")

factory = APIRequestFactory()
request = factory.post(f'/api/invoices/{invoice.id}/send_email/', HTTP_X_BUSINESS_ID=str(invoice.business.id))
force_authenticate(request, user=invoice.business.user)

view = InvoiceViewSet.as_view({'post': 'send_email'})

try:
    response = view(request, pk=invoice.id)
    print("Final Status Code:", response.status_code)
    print("Final Response:", response.data)
except Exception as e:
    import traceback
    traceback.print_exc()

print("Done testing send_email")
