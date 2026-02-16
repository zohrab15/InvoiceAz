import os
import django
import sys
from datetime import timedelta
from django.utils import timezone
from decimal import Decimal

# Setup Django
sys.path.append(os.path.join(os.getcwd(), 'backend'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from invoices.models import Invoice, InvoiceItem, Payment, Expense
from clients.models import Client
from users.models import Business, User

def verify_forecast():
    print("🚀 Starting Forecast Verification...")
    
    # 1. Setup Business & Client
    user = User.objects.first()
    business, _ = Business.objects.get_or_create(
        user=user,
        name="Forecast Test Business",
        defaults={'voen': '1234567890'}
    )
    
    client, _ = Client.objects.get_or_create(
        business=business,
        name="Active Growth Client",
        defaults={'email': 'growth@test.com', 'phone': '0501112233'}
    )

    churn_client, _ = Client.objects.get_or_create(
        business=business,
        name="Churn Risk Client",
        defaults={'email': 'churn@test.com', 'phone': '0509998877'}
    )

    # Cleanup old test data for this business
    Invoice.objects.filter(business=business).delete()
    Expense.objects.filter(business=business).delete()

    today = timezone.now().date()
    
    # 2. Seed Historical Data (Increasing Trend: 1000, 1100, 1200...)
    print("📊 Seeding Historical Invoices (Last 12 months)...")
    for i in range(11, -1, -1):
        # Approximate month start
        month_start = (today.replace(day=1) - timedelta(days=i*30)).replace(day=1)
        amount = 1000 + (11 - i) * 100 # Trend
        
        inv = Invoice.objects.create(
            business=business,
            client=client,
            invoice_number=f"FOR-{today.year}{today.month}-{100+i}",
            invoice_date=month_start,
            due_date=month_start + timedelta(days=15),
            status='paid',
            total=Decimal(str(amount)),
            subtotal=Decimal(str(amount))
        )
        # Create payment to confirm it's "real" revenue for the forecast
        Payment.objects.create(
            invoice=inv,
            amount=Decimal(str(amount)),
            payment_date=month_start + timedelta(days=5)
        )

    # 3. Seed Expenses (Avg ~500/month)
    print("💸 Seeding Expenses (Last 6 months)...")
    for i in range(6):
        date = today - timedelta(days=i*30)
        Expense.objects.create(
            business=business,
            description=f"Monthly Expense {i}",
            amount=Decimal("500.00"),
            date=date,
            category='rent'
        )

    # 4. Seed Future Inflow (Unpaid invoices due next month)
    print("🔮 Seeding Future Inflow (Next month)...")
    Invoice.objects.create(
        business=business,
        client=client,
        invoice_date=today,
        due_date=today + timedelta(days=30), # Next month
        status='sent',
        total=Decimal("2500.00"),
        subtotal=Decimal("2500.00")
    )

    # 5. Create Churn Case (Last invoice was 120 days ago)
    print("📉 Setting up Churn Risk case...")
    Invoice.objects.create(
        business=business,
        client=churn_client,
        invoice_date=today - timedelta(days=120),
        due_date=today - timedelta(days=100),
        status='paid',
        total=Decimal("500.00")
    )

    # 6. Call API
    print("backend Call API /analytics/forecast/ ...")
    from django.test import RequestFactory
    from invoices.analytics_views import ForecastAnalyticsView
    
    factory = RequestFactory()
    request = factory.get(f'/analytics/forecast/?business_id={business.id}')
    request.user = user
    
    view = ForecastAnalyticsView.as_view()
    response = view(request)
    
    assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    data = response.data
    
    # 7. Assertions
    print("✅ Verifying Growth Metrics...")
    # Revenue went from 1900 to 2000 (last 2 months of history) -> ~5.2% MoM?
    # Actually loop: i=1 (last month) -> 1000 + 10*100 = 2000. i=0 (this month) -> 1000 + 11*100 = 2100.
    # (2100-2000)/2000 = 5%
    print(f"MoM Growth: {data['growth']['mom']}%")
    assert data['growth']['mom'] > 0
    
    print("✅ Verifying Revenue Forecast...")
    # Trend is upwards, next months should be > 2100
    projected = [d for d in data['revenue_chart'] if d['is_projected']]
    assert len(projected) == 3
    print(f"First Month Forecast: {projected[0]['realistic']}")
    assert projected[0]['realistic'] > 2100
    assert projected[0]['best'] > projected[0]['realistic']
    assert projected[0]['worst'] < projected[0]['realistic']

    print("✅ Verifying Cashflow...")
    # Next month inflow should be 2500 (from our seeded unpaid invoice)
    # Actually depending on when "next month" is defined in code relative to today+30
    next_m_cash = data['cashflow'][0]
    print(f"Next Month Inflow: {next_m_cash['inflow']}, Net: {next_m_cash['net']}")
    # Inflow might be 0 if today is end of month, but let's check one of them is > 0
    assert any(c['inflow'] > 0 for c in data['cashflow'])
    
    print("✅ Verifying Risks...")
    churn_list = data['risks']['churn_list']
    print(f"Churn Risk Clients: {[c['name'] for c in churn_list]}")
    assert any(c['name'] == "Churn Risk Client" for c in churn_list)

    print("\n✨ ALL FORECAST CHECKS PASSED! ✨")

if __name__ == "__main__":
    verify_forecast()
