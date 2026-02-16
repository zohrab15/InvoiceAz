import os
import django
from datetime import datetime, timedelta
import random

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from users.models import User, Business
from clients.models import Client
from invoices.models import Invoice, InvoiceItem, Expense

def seed_data():
    # 1. Get or create a default user
    user = User.objects.first()
    if not user:
        print("No user found. Creating default admin user (admin@invoice.az / admin123)...")
        user = User.objects.create_superuser(
            email='admin@invoice.az',
            password='admin123',
            first_name='Admin',
            last_name='User'
        )
    
    business = Business.objects.filter(user=user).first()
    if not business:
        print(f"Creating default business for {user.email}...")
        business = Business.objects.create(
            user=user, 
            name="Mənim Biznesim MMC", 
            is_active=True,
            address="Bakı şəhəri, Heydər Əliyev pr. 101",
            phone="+994 12 123 45 67"
        )
    
    print(f"Seeding data for business: {business.name} (User: {user.email})")

    # 2. Create Clients
    clients_data = [
        {"name": "Bakı İnşaat MMC", "client_type": "company", "email": "info@bakuinsaat.az", "voen": "1234567891"},
        {"name": "AzarTexnika ASC", "client_type": "company", "email": "contact@azertexnika.az", "voen": "9876543210"},
        {"name": "Anar Məmmədov", "client_type": "individual", "email": "anar@mail.az", "phone": "+994 50 123 45 67"},
        {"name": "Lalə Əliyeva", "client_type": "individual", "email": "lala@test.az", "phone": "+994 70 987 65 43"},
        {"name": "Global Solutions LLC", "client_type": "company", "email": "office@global.az", "voen": "5556667778"},
    ]
    
    clients = []
    for cd in clients_data:
        client, created = Client.objects.get_or_create(business=business, name=cd["name"], defaults=cd)
        clients.append(client)
    
    print(f"Created {len(clients)} clients.")

    # 3. Create Invoices
    for i in range(1, 11):
        client = random.choice(clients)
        status = random.choice(['draft', 'sent', 'paid', 'cancelled'])
        days_ago = random.randint(1, 60)
        date = datetime.now() - timedelta(days=days_ago)
        due_date = date + timedelta(days=14)
        
        invoice = Invoice.objects.create(
            business=business,
            client=client,
            invoice_number=f"INV-2026-{i:03d}",
            status=status,
            invoice_date=date.date(),
            due_date=due_date.date(),
            notes="Təşəkkür edirik!"
        )
        
        # Add 1-3 items to each invoice
        for _ in range(random.randint(1, 3)):
            InvoiceItem.objects.create(
                invoice=invoice,
                description=random.choice(["Veb sayt hazırlanması", "Konsultasiya xidməti", "Dizayn işləri", "SEO optimallaşdırma", "Texniki dəstək"]),
                quantity=random.randint(1, 5),
                unit_price=random.randint(50, 500),
                tax_rate=18
            )
        
        invoice.calculate_totals()
    
    print("Created 10 invoices.")

    # 4. Create Expenses
    expense_categories = ["office", "salary", "marketing", "rent", "travel", "other"]
    for i in range(1, 8):
        days_ago = random.randint(1, 45)
        date = datetime.now() - timedelta(days=days_ago)
        
        Expense.objects.create(
            business=business,
            description=f"Mock Xərc #{i}",
            amount=random.randint(20, 300),
            date=date.date(),
            category=random.choice(expense_categories),
            payment_method="Nəqd"
        )
    
    print("Created 7 expenses.")
    print("Seeding complete! 🚀")

if __name__ == "__main__":
    seed_data()
