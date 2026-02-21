import os
import django
import sys
from decimal import Decimal

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from invoices.models import Invoice
from django.db.models import Sum

def check_all_businesses():
    from users.models import Business
    
    for business in Business.objects.all():
        invoices = Invoice.objects.filter(business=business)
        total_all = invoices.aggregate(total=Sum('total'))['total'] or Decimal('0')
        
        print(f"\nBusiness: {business.name} (ID: {business.id})")
        print(f"Total Revenue (All Statuses): {total_all:,.2f}₼")
        
        # Dashboard Logic match
        pending_sent = invoices.filter(status='sent').aggregate(total=Sum('total'))['total'] or Decimal('0')
        print(f"Current Dashboard 'Pending' (Sent only): {pending_sent:,.2f}₼")
        
        print(f"Breakdown:")
        for status, name in Invoice.STATUS_CHOICES:
            s_total = invoices.filter(status=status).aggregate(total=Sum('total'))['total'] or Decimal('0')
            count = invoices.filter(status=status).count()
            if count > 0:
                print(f"  {status:10}: {s_total:10.2f}₼ ({count})")

if __name__ == "__main__":
    check_all_businesses()
