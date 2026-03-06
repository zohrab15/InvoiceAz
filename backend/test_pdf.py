import os
import django
import sys

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from invoices.models import Invoice
from invoices.views import InvoiceViewSet
from rest_framework.test import APIRequestFactory

invoice = Invoice.objects.first()
if not invoice:
    print("No invoices found.")
    sys.exit()

print(f"Testing PDF generation for invoice: {invoice.invoice_number}")
print(f"Business Logo: {invoice.business.logo.url if invoice.business.logo else 'None'}")

viewset = InvoiceViewSet()
# emulate what _generate_pdf does
try:
    pdf_content = viewset._generate_pdf(invoice)
    if pdf_content:
        print("PDF generated successfully (len:", len(pdf_content), ")")
    else:
        print("PDF generated as None")
except Exception as e:
    import traceback
    traceback.print_exc()

print("Done testing PDF")
