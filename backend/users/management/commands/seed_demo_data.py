import random
from datetime import timedelta
from decimal import Decimal
from django.core.management.base import BaseCommand
from django.utils import timezone
from allauth.account.models import EmailAddress
from users.models import User, Business
from clients.models import Client
from inventory.models import Product
from invoices.models import Invoice, InvoiceItem, Payment, Expense

class Command(BaseCommand):
    help = 'Populates the database with demo data for presentation purposes.'

    def handle(self, *args, **kwargs):
        self.stdout.write('Seeding demo data...')

        # 1. Create Demo User
        email = 'demo_user@invoice.az'
        
        user, created = User.objects.get_or_create(
            email=email,
            defaults={
                'first_name': 'Demo',
                'last_name': 'İstifadəçi',
                'is_active': True,
                'is_email_verified': True,
                'membership': 'pro'
            }
        )
        user.set_password('demopassword123')
        
        # Ensure subscription plan if exists
        from users.models import SubscriptionPlan
        free_plan = SubscriptionPlan.objects.filter(name='pro').first() # Give pro to demo
        if not free_plan:
            free_plan = SubscriptionPlan.objects.filter(name='free').first()
        
        if free_plan:
            user.subscription_plan = free_plan
            
        user.membership = 'pro'
        user.is_active = True
        user.is_email_verified = True
        user.save()
        
        if created:
            self.stdout.write(f'Created fresh demo user: {email}')
        else:
            self.stdout.write(f'Updated existing demo user: {email}')

        # Ensure NotificationSetting exists
        from notifications.models import NotificationSetting
        NotificationSetting.objects.get_or_create(user=user)

        # Safely find or create the business without deleting it to preserve user testing state
        # (like manually assigned clients, new invoices, etc.)

        business, created = Business.objects.get_or_create(
            user=user,
            name='Modern Solutions MMC',
            defaults={
                'voen': '1234567891',
                'address': 'Bakı ş., Nizami küç. 10',
                'city': 'Bakı',
                'phone': '+994 50 123 45 67',
                'email': 'info@modernsolutions.az',
                'website': 'https://modernsolutions.az',
                'bank_name': 'Paşa Bank ASC',
                'iban': 'AZ12PRBA0000001234567890',
                'swift': 'PRBAAZ2X',
                'budget_limit': Decimal('5000.00')
            }
        )
        self.stdout.write(f'Using business: {business.name}')

        if not created:
            self.stdout.write(self.style.SUCCESS(f'Demo business "{business.name}" already exists. Skipping duplicate data seeding to preserve user state.'))
            return

        # 3. Create Clients
        client_data = [
            ('Bakı İnşaat MMC', 'company', 'Vüqar Əliyev', 'vugar@bakuinsaat.az', '1234567890'),
            ('Kontakt Home', 'company', 'Məmməd Quliyev', 'info@kontakt.az', '9876543210'),
            ('Anar Məmmədov', 'individual', None, 'anar@gmail.com', None),
            ('Leyla Həsənova', 'individual', None, 'leyla@mail.ru', None),
            ('Bravo Supermarket', 'company', 'Elvin Rzayev', 'procurement@bravo.az', '5554443332'),
            ('Azercell Telekom', 'company', 'Günel xanım', 'billing@azercell.com', '1112223334'),
            ('Azərpoçt', 'company', 'Rəşad Bağırov', 'support@azerpost.az', '7778889990'),
        ]

        clients = []
        for name, ctype, person, email, voen in client_data:
            c, _ = Client.objects.get_or_create(
                business=business,
                name=name,
                defaults={
                    'client_type': ctype,
                    'contact_person': person,
                    'email': email,
                    'voen': voen,
                    'address': 'Azərbaycan, Bakı'
                }
            )
            clients.append(c)
        self.stdout.write(f'Seeded {len(clients)} clients.')

        # 4. Create Products
        product_data = [
            ('Veb sayt hazırlanması', 'Professional korporativ sayt', 'WEB-001', 1200.00, 'service'),
            ('SEO Optimizasiya', 'Aylıq SEO xidməti', 'SEO-001', 400.00, 'service'),
            ('Konsaltinq', 'Saatlıq məsləhət xidməti', 'CONS-001', 100.00, 'service'),
            ('Noutbuk HP Pavilion', '16GB RAM, 512GB SSD', 'LAP-001', 1850.00, 'pcs'),
            ('Monitor Dell 27"', '4K UHD Resolution', 'MON-001', 650.00, 'pcs'),
            ('Ofis kreslosu', 'Erqonomik dizayn', 'FUR-001', 220.00, 'pcs'),
            ('Klaviatura Logitech', 'Mexaniki oyun klaviaturası', 'ACC-001', 150.00, 'pcs'),
            ('SMM xidməti', 'Sosial media menecmenti', 'SMM-001', 500.00, 'service'),
            ('Logotip dizaynı', 'Brendinq və logo', 'DSN-001', 300.00, 'service'),
            ('Yazıcı Canon', 'Rəngli lazer yazıcı', 'PRN-001', 450.00, 'pcs'),
        ]

        products = []
        for name, desc, sku, price, unit in product_data:
            p, _ = Product.objects.get_or_create(
                business=business,
                sku=sku,
                defaults={
                    'name': name,
                    'description': desc,
                    'base_price': Decimal(str(price)),
                    'unit': unit,
                    'stock_quantity': Decimal(random.randint(5, 50))
                }
            )
            products.append(p)
        self.stdout.write(f'Seeded {len(products)} products.')

        # 5. Create Invoices
        statuses = ['paid', 'paid', 'paid', 'sent', 'overdue', 'draft']
        now = timezone.now()
        
        for i in range(25):
            client = random.choice(clients)
            days_ago = random.randint(1, 90)
            date = now - timedelta(days=days_ago)
            due_date = date + timedelta(days=14)
            status = random.choice(statuses)
            
            invoice = Invoice.objects.create(
                business=business,
                client=client,
                invoice_number=f"DMO-{timezone.now().strftime('%H%M%S')}-{i+1}",
                invoice_date=date,
                due_date=due_date,
                status=status,
                notes="Təqdimat üçün demo faktura.",
                tax_rate=Decimal('18.00')
            )
            
            # Add items
            num_items = random.randint(1, 4)
            selected_products = random.sample(products, num_items)
            for prod in selected_products:
                qty = Decimal(random.randint(1, 3))
                InvoiceItem.objects.create(
                    invoice=invoice,
                    product=prod,
                    description=prod.name,
                    quantity=qty,
                    unit=prod.unit,
                    unit_price=prod.base_price,
                    tax_rate=Decimal('18.00')
                )
            
            invoice.calculate_totals()
            
            # If paid, add payment
            if status == 'paid':
                Payment.objects.create(
                    invoice=invoice,
                    amount=invoice.total,
                    payment_date=date + timedelta(days=2),
                    payment_method=random.choice(['Cash', 'Bank Transfer', 'Card'])
                )
                
        self.stdout.write('Seeded 25 invoices.')

        # 6. Create Expenses
        categories = ['office', 'salary', 'marketing', 'rent', 'software', 'transport']
        expense_names = {
            'office': ['Kanselyariya malları', 'Su sifarişi', 'Təmizlik vasitələri'],
            'salary': ['Aylıq maaş ödənişi', 'Bonuslar', 'Sosial ödənişlər'],
            'marketing': ['Facebook Ads', 'Google Ads', 'Flayer çapı'],
            'rent': ['Ofis icarəsi', 'Kommunal ödənişlər', 'İnternet'],
            'software': ['Adobe Cloud abunəliyi', 'GitHub Pro', 'Server xərcləri'],
            'transport': ['Yanacaq xərci', 'Taksi ödənişləri', 'Maşın təmiri'],
        }

        for i in range(15):
            cat = random.choice(categories)
            desc = random.choice(expense_names[cat])
            days_ago = random.randint(1, 60)
            date = now - timedelta(days=days_ago)
            
            Expense.objects.create(
                business=business,
                description=desc,
                amount=Decimal(random.randint(50, 1500)),
                date=date,
                category=cat,
                status='paid'
            )
        self.stdout.write('Seeded 15 expenses.')
        self.stdout.write(self.style.SUCCESS('Demo data seeding completed!'))
