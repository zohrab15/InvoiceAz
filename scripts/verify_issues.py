
import os
import django
from datetime import timedelta
from django.utils import timezone
import sys
import random

# Setup Django environment
sys.path.append(os.path.join(os.path.dirname(__file__), '../backend'))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from users.models import User, Business
from clients.models import Client
from invoices.models import Invoice, InvoiceItem
from rest_framework.test import APIRequestFactory
from invoices.analytics_views import ProblematicInvoicesView

def run_verification():
    print("🚀 Starting Problematic Invoices Verification...")

    # 1. Setup User & Business
    email = "admin@example.com"
    user, _ = User.objects.get_or_create(email=email)
    business, _ = Business.objects.get_or_create(user=user, name="Test Business Verify")
    
    print(f"✅ Business: {business.name}")

    # 2. Setup Clients
    client_a, _ = Client.objects.get_or_create(business=business, name="Late Client A", email="late_a@example.com")
    client_b, _ = Client.objects.get_or_create(business=business, name="Critical Client B", email="crit_b@example.com")
    
    # 3. Create Overdue Invoices
    today = timezone.now().date()
    
    # Client A: 45 days overdue (31-60 bracket)
    inv_a, _ = Invoice.objects.get_or_create(
        invoice_number="OD-001",
        business=business,
        defaults={
            'client': client_a,
            'invoice_date': today - timedelta(days=50),
            'due_date': today - timedelta(days=45),
            'status': 'overdue',
            'total': 100.00,
            'paid_amount': 0
        }
    )
    if inv_a.total != 100.00: # reset if exists
        inv_a.total = 100.00
        inv_a.paid_amount = 0
        inv_a.due_date = today - timedelta(days=45)
        inv_a.save()

    # Client B: 100 days overdue (90+ bracket)
    inv_b, _ = Invoice.objects.get_or_create(
        invoice_number="OD-002",
        business=business,
        defaults={
            'client': client_b,
            'invoice_date': today - timedelta(days=110),
            'due_date': today - timedelta(days=100),
            'status': 'overdue',
            'total': 500.00,
            'paid_amount': 0
        }
    )
    if inv_b.total != 500.00:
        inv_b.total = 500.00
        inv_b.paid_amount = 0
        inv_b.due_date = today - timedelta(days=100)
        inv_b.save()
        
    print("✅ Seeded Overdue Invoices")

    # 4. Test API
    factory = APIRequestFactory()
    request = factory.get(f'/api/analytics/issues/?business_id={business.id}')
    request.user = user
    
    view = ProblematicInvoicesView.as_view()
    response = view(request)
    
    if response.status_code == 200:
        data = response.data
        print("\n📊 Analytics Results:")
        print("-" * 30)
        
        kpi = data['kpi']
        print(f"Total Overdue: {kpi['total_overdue']}")
        print(f"Critical Debt: {kpi['critical_debt']}")
        print(f"Debtors Count: {kpi['debtors_count']}")
        
        # Verify KPI
        if kpi['total_overdue'] == 600.0 and kpi['critical_debt'] == 500.0:
            print("✅ KPI Verified!")
        else:
            print("❌ KPI Mismatch!")

        print("\nAging Buckets:")
        for bucket in data['aging']:
            print(f"- {bucket['range']}: {bucket['amount']}")
            
        print("\nDebtors:")
        for debtor in data['debtors']:
            print(f"- {debtor['name']}: {debtor['total_debt']} (Max Overdue: {debtor['max_overdue_days']} days)")
            
        print("\n🎉 ALL CHECKS PASSED!" if kpi['total_overdue'] == 600.0 else "\n❌ FAILED")
        
    else:
        print(f"❌ API Error: {response.status_code}")
        print(response.data)

if __name__ == "__main__":
    run_verification()
