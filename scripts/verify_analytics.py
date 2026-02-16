import os
import django
import sys
from datetime import date, timedelta

# Setup Django environment
sys.path.append(os.path.join(os.path.dirname(__file__), '../backend'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from users.models import User, Business
from clients.models import Client
from invoices.models import Invoice, Payment, InvoiceItem
from invoices.analytics_views import PaymentAnalyticsView
from rest_framework.test import APIRequestFactory

def run_verification():
    print("🚀 Starting Payment Analytics Verification...")
    
    # 1. Setup Data
    email = "analytics_test@example.com"
    user, _ = User.objects.get_or_create(email=email)
    business, _ = Business.objects.get_or_create(user=user, name="Analytics Test Corp")
    client, _ = Client.objects.get_or_create(business=business, name="Test Client A", email="client@test.com")
    
    print(f"✅ Business: {business.name}")

    # Clear previous test data
    Invoice.objects.filter(business=business).delete()

    # 2. Create Invoices & Payments scenarios
    
    # Scenario A: On-time payment (Paid within 2 days)
    inv1 = Invoice.objects.create(business=business, client=client, invoice_number="AN-001", invoice_date=date.today()-timedelta(days=10), due_date=date.today()-timedelta(days=5))
    InvoiceItem.objects.create(invoice=inv1, description="Item 1", unit_price=100, quantity=1)
    inv1.calculate_totals()
    Payment.objects.create(invoice=inv1, amount=100, payment_date=date.today()-timedelta(days=8), payment_method="Bank")
    # Paid date (today-8) < Due date (today-5) -> On Time
    # Speed: (today-8) - (today-10) = 2 days (0-7 bucket)

    # Scenario B: Late payment (Paid 3 days late)
    inv2 = Invoice.objects.create(business=business, client=client, invoice_number="AN-002", invoice_date=date.today()-timedelta(days=20), due_date=date.today()-timedelta(days=15))
    InvoiceItem.objects.create(invoice=inv2, description="Item 2", unit_price=200, quantity=1)
    inv2.calculate_totals()
    Payment.objects.create(invoice=inv2, amount=200, payment_date=date.today()-timedelta(days=12), payment_method="Cash")
    # Paid date (today-12) > Due date (today-15) -> Late by 3 days
    # Speed: (today-12) - (today-20) = 8 days (8-14 bucket)

    # Scenario C: Very Late payment (Paid 25 days late)
    inv3 = Invoice.objects.create(business=business, client=client, invoice_number="AN-003", invoice_date=date.today()-timedelta(days=60), due_date=date.today()-timedelta(days=50))
    InvoiceItem.objects.create(invoice=inv3, description="Item 3", unit_price=300, quantity=1)
    inv3.calculate_totals()
    Payment.objects.create(invoice=inv3, amount=300, payment_date=date.today()-timedelta(days=25), payment_method="Card")
    # Paid date (today-25) > Due date (today-50) -> Late by 25 days
    # Speed: (today-25) - (today-60) = 35 days (30+ bucket)

    print("✅ Created 3 Invoices with specific payment scenarios.")

    # 3. Call API View
    factory = APIRequestFactory()
    request = factory.get(f'/api/analytics/payments/?business_id={business.id}')
    request.user = user
    view = PaymentAnalyticsView.as_view()
    response = view(request)

    data = response.data
    
    print("\n📊 Analytics Results:")
    print("-" * 30)
    
    # Check Behavior
    beh = data['behavior']
    print(f"Behavior: On-Time: {beh['on_time_pct']}%, Late: {beh['late_pct']}%, Avg Overdue: {beh['avg_overdue_days']} days")
    
    # Expected: 
    # Total 3 payments.
    # On-time: 1 (Inv1) -> 33.3%
    # Late: 2 (Inv2, Inv3) -> 66.7%
    # Overdue days: Inv2 (3 days), Inv3 (25 days) -> Avg (28/2) = 14 days
    
    assert round(beh['on_time_pct'], 1) == 33.3
    assert round(beh['late_pct'], 1) == 66.7
    assert beh['avg_overdue_days'] == 14.0
    print("✅ Behavior Metrics verified!")

    # Check Speed
    speed = {s['range']: s['count'] for s in data['speed']}
    print(f"Speed Buckets: {speed}")
    # Expected:
    # 0-7: 1 (Inv1)
    # 8-14: 1 (Inv2)
    # 30+: 1 (Inv3)
    assert speed['0-7 gün'] == 1
    assert speed['8-14 gün'] == 1
    assert speed['30+ gün'] == 1
    print("✅ Speed Metrics verified!")

    # Check Rating
    ratings = data['customer_ratings']
    client_rating = ratings[0]
    print(f"Customer Rating: {client_rating['name']} - {client_rating['rating']} ({client_rating['avg_delay']} avg delay)")
    
    # Expected:
    # Delays: Inv1 (-3), Inv2 (+3), Inv3 (+25) -> Sum: 25. Avg: 25/3 = 8.33
    # Rating Should be B (4-10 days)
    
    assert client_rating['rating'] == 'B'
    assert round(client_rating['avg_delay'], 1) == 8.3
    print("✅ Customer Rating verified!")

    print("\n🎉 ALL CHECKS PASSED!")

if __name__ == '__main__':
    run_verification()
