import os
import django
import random
from datetime import datetime, timedelta
from decimal import Decimal

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from users.models import User, Business
from clients.models import Client
from inventory.models import Product
from invoices.models import Invoice, InvoiceItem, Expense, Payment

def seed_demo():
    print("--- STARTING DEMO SEEDING ---")
    
    # 1. Create Demo User
    email = 'demo_user@invoice.az'
    password = 'demopassword123'
    
    user, created = User.objects.get_or_create(
        email=email,
        defaults={
            'first_name': 'Zohrab',
            'last_name': 'Demo',
            'is_active': True
        }
    )
    if created:
        user.set_password(password)
        user.save()
        print(f"Created demo user: {email}")
    else:
        # Reset password just in case
        user.set_password(password)
        user.save()
        print(f"Found existing demo user: {email}")

    # 2. Create Business
    business, created = Business.objects.get_or_create(
        user=user,
        name="Modern Solutions MMC",
        defaults={
            'is_active': True,
            'address': 'Baku, Azerbaijan',
            'phone': '+994 50 000 00 00',
            'voen': '1234567890'
        }
    )
    print(f"Business: {business.name}")

    # 3. Create Clients
    client_names = [
        "Global Tech ASC", "Baku Retail Group", "Azeri Services LLC",
        "Anar Aliyev (Individual)", "Gunel Mehdiyeva (Individual)", "West Port LLC"
    ]
    clients = []
    for name in client_names:
        client, _ = Client.objects.get_or_create(
            business=business,
            name=name,
            defaults={
                'email': f"contact@{name.lower().replace(' ', '')}.az",
                'phone': '+994 70' + ''.join([str(random.randint(0,9)) for _ in range(7)]),
                'client_type': 'company' if 'MMC' in name or 'ASC' in name or 'LLC' in name else 'individual'
            }
        )
        clients.append(client)
    print(f"Seeded {len(clients)} clients.")

    # 4. Create Products
    products_data = [
        {"name": "Laptop Pro 14", "sku": "LP-001", "base_price": 1200, "unit": "pcs"},
        {"name": "Wireless Mouse", "sku": "WM-002", "base_price": 25, "unit": "pcs"},
        {"name": "Cloud Hosting (Monthly)", "sku": "CH-100", "base_price": 150, "unit": "service"},
        {"name": "Software Development (Hour)", "sku": "SD-500", "base_price": 50, "unit": "service"},
        {"name": "Networking Cable (m)", "sku": "NC-200", "base_price": 2.5, "unit": "m"},
    ]
    products = []
    for pd in products_data:
        prod, _ = Product.objects.get_or_create(
            business=business,
            sku=pd['sku'],
            defaults={
                'name': pd['name'],
                'base_price': pd['base_price'],
                'unit': pd['unit'],
                'stock_quantity': 100
            }
        )
        products.append(prod)
    print(f"Seeded {len(products)} products.")

    # 5. Create Invoices (Last 6 months)
    print("Seeding invoices...")
    total_invoices = 24
    for i in range(total_invoices):
        client = random.choice(clients)
        # Spread dates over last 180 days
        days_ago = random.randint(0, 180)
        date = datetime.now() - timedelta(days=days_ago)
        
        # Mix statuses
        if i < 15:
            status = 'paid'
        elif i < 20:
            status = 'sent'
        else:
            status = 'draft'
            
        inv = Invoice.objects.create(
            business=business,
            client=client,
            invoice_number=f"DEMO-{date.strftime('%y%m%d')}-{i:02d}",
            invoice_date=date.date(),
            due_date=(date + timedelta(days=14)).date(),
            status=status,
            notes="Təşəkkür edirik!",
        )
        
        # Add 1-4 items
        for _ in range(random.randint(1, 4)):
            prod = random.choice(products)
            qty = random.randint(1, 5)
            InvoiceItem.objects.create(
                invoice=inv,
                product=prod,
                description=prod.name,
                quantity=qty,
                unit_price=prod.base_price,
                tax_rate=18,
                unit=prod.unit
            )
        inv.calculate_totals()
        
        # 6. Create Payments for 'paid' invoices
        if status == 'paid':
            Payment.objects.create(
                invoice=inv,
                amount=inv.total,
                payment_date=inv.invoice_date,
                payment_method='transfer'
            )
            inv.update_payment_status()

    # 7. Create Expenses (Last 6 months)
    print("Seeding expenses...")
    expense_categories = ["office", "salary", "marketing", "rent", "travel", "software"]
    for i in range(12):
        days_ago = random.randint(0, 180)
        date = datetime.now() - timedelta(days=days_ago)
        
        Expense.objects.create(
            business=business,
            description=f"Demo Xərc #{i}",
            amount=Decimal(random.randint(50, 400)),
            date=date.date(),
            category=random.choice(expense_categories),
            payment_method="Nəqd"
        )

    print("--- DEMO SEEDING COMPLETE ---")

if __name__ == "__main__":
    seed_demo()
