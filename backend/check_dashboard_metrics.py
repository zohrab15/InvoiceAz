import os
import django
import sys
from decimal import Decimal

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from invoices.models import Invoice
from django.db.models import Sum

def find_business_by_transactions():
    from users.models import Business
    
    # We look for a business that has these specific amounts in invoices
    # +5,369.00, +4,366.00, +7,563.80, +767.00, +2,560.60, +5,428.00, +1,298.00
    target_amounts = [5369.00, 4366.00, 7563.80, 767.00, 2560.60, 5428.00, 1298.00]
    
    for business in Business.objects.all():
        invoices = Invoice.objects.filter(business=business)
        inv_totals = [float(i.total) for i in invoices]
        
        matches = 0
        for amt in target_amounts:
            if amt in inv_totals:
                matches += 1
        
        if matches >= 3: # If at least 3 match, it's likely the one
            total_all = invoices.aggregate(total=Sum('total'))['total'] or Decimal('0')
            pending_sent = invoices.filter(status='sent').aggregate(total=Sum('total'))['total'] or Decimal('0')
            pending_correct = invoices.filter(status__in=['sent', 'viewed', 'overdue']).aggregate(total=Sum('total'))['total'] or Decimal('0')
            
            print(f"Business: {business.name} (ID: {business.id})")
            print(f"Reported Metrics Match Progress:")
            print(f"  Current 'Ümumi Gəlir' (All): {total_all:,.2f}₼")
            print(f"  Current 'Gözləyən' (Sent only): {pending_sent:,.2f}₼")
            print(f"  Predicted 'Pending' (Sent+Viewed+Overdue): {pending_correct:,.2f}₼")
            
            print(f"\nStatus Breakdown:")
            for status, _ in Invoice.STATUS_CHOICES:
                s_total = invoices.filter(status=status).aggregate(total=Sum('total'))['total'] or Decimal('0')
                if s_total > 0:
                    print(f"  {status:10}: {s_total:10.2f}₼")
            
            return

    print("Business NOT found by transaction amounts.")

if __name__ == "__main__":
    find_business_by_transactions()
