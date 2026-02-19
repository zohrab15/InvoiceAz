import os
import django
import sys

# Set up Django environment
sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings') # Need to find the correct settings path
django.setup()

from invoices.models import Invoice
from users.models import Business

def check_invoice(invoice_id, business_id):
    try:
        invoice = Invoice.objects.get(id=invoice_id)
        print(f"Invoice {invoice_id} exists.")
        print(f"Invoice Number: {invoice.invoice_number}")
        print(f"Business ID: {invoice.business.id}")
        print(f"Business Name: {invoice.business.name}")
        print(f"Owner: {invoice.business.user.email}")
        
        if invoice.business.id == int(business_id):
            print("MATCH: Invoice belongs to Business ID provided.")
        else:
            print(f"MISMATCH: Invoice belongs to Business {invoice.business.id}, not {business_id}.")
            
    except Invoice.DoesNotExist:
        print(f"Invoice {invoice_id} NOT FOUND in database.")

    try:
        business = Business.objects.get(id=business_id)
        print(f"Business {business_id} exists: {business.name}")
    except Business.DoesNotExist:
        print(f"Business {business_id} NOT FOUND in database.")

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python debug_invoice.py <invoice_id> <business_id>")
    else:
        check_invoice(sys.argv[1], sys.argv[2])
