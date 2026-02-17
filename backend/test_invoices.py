import os
import django
import sys
import json
from decimal import Decimal

# Setup Django environment
sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from users.models import User, Business
from invoices.models import Invoice

def test_invoices():
    email = 'demo_user@invoice.az'
    try:
        user = User.objects.get(email=email)
        print(f"User: {user.email}")
        
        businesses = Business.objects.filter(user=user)
        for b in businesses:
            print(f"Business: {b.name} (ID: {b.id})")
            invoices = Invoice.objects.filter(business=b)
            print(f"  Invoices count: {invoices.count()}")
            for inv in invoices[:5]:
                print(f"    - Inv {inv.invoice_number} | Total: {inv.total}")
                
    except User.DoesNotExist:
        print("User not found")

if __name__ == "__main__":
    test_invoices()
