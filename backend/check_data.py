import os
import django
import sys
from decimal import Decimal

# Setup Django environment
sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from users.models import User, Business
from clients.models import Client
from invoices.models import Invoice, Expense, Payment
from inventory.models import Product

def check_data():
    email = 'demo_user@invoice.az'
    try:
        user = User.objects.get(email=email)
        print(f"User: {user.email}")
        
        businesses = Business.objects.filter(user=user)
        print(f"Businesses: {businesses.count()}")
        
        for b in businesses:
            print(f"\nBusiness: {b.name} (ID: {b.id})")
            print(f"  Clients: {Client.objects.filter(business=b).count()}")
            print(f"  Products: {Product.objects.filter(business=b).count()}")
            print(f"  Invoices: {Invoice.objects.filter(business=b).count()}")
            print(f"  Expenses: {Expense.objects.filter(business=b).count()}")
            print(f"  Payments: {Payment.objects.filter(invoice__business=b).count()}")
            
            # Print first 3 invoices
            invs = Invoice.objects.filter(business=b)[:3]
            for i in invs:
                print(f"    Inv #{i.invoice_number} | Total: {i.total} | Status: {i.status}")
                
    except User.DoesNotExist:
        print("Demo user not found.")

if __name__ == "__main__":
    check_data()
