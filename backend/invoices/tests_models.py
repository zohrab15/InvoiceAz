from django.test import TestCase
from django.contrib.auth import get_user_model
from users.models import Business
from clients.models import Client
from invoices.models import Invoice, InvoiceItem, Payment, Expense
from django.utils import timezone
from datetime import timedelta
import decimal

User = get_user_model()

class InvoiceModelTestCase(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(email='test@invoices.com', password='password')
        self.business = Business.objects.create(name='Test Business', user=self.user)
        self.client = Client.objects.create(name='Test Client', business=self.business)

    def test_invoice_creation(self):
        invoice = Invoice.objects.create(
            business=self.business,
            client=self.client,
            invoice_date=timezone.now().date(),
            due_date=(timezone.now() + timedelta(days=7)).date()
        )
        self.assertEqual(invoice.status, 'draft')
        self.assertIsNotNone(invoice.share_token)
        self.assertTrue(invoice.invoice_number.startswith('INV-'))

    def test_calculate_totals(self):
        invoice = Invoice.objects.create(
            business=self.business,
            client=self.client,
            invoice_date=timezone.now().date(),
            due_date=timezone.now().date()
        )
        # Create items
        InvoiceItem.objects.create(invoice=invoice, description='Item 1', quantity=2, unit_price=10.00, tax_rate=10.00) # Amount: 20
        InvoiceItem.objects.create(invoice=invoice, description='Item 2', quantity=1, unit_price=50.00) # Amount: 50
        
        invoice.calculate_totals()
        invoice.refresh_from_db()

        self.assertEqual(invoice.subtotal, decimal.Decimal('70.00')) # 20 + 50
        self.assertEqual(invoice.tax_amount, decimal.Decimal('2.00')) # 10% of 20 = 2
        self.assertEqual(invoice.total, decimal.Decimal('72.00')) # 70 + 2

    def test_update_payment_status(self):
        invoice = Invoice.objects.create(
            business=self.business,
            client=self.client,
            invoice_date=timezone.now().date(),
            due_date=timezone.now().date()
        )
        InvoiceItem.objects.create(invoice=invoice, description='Item 1', quantity=1, unit_price=100.00)
        invoice.calculate_totals()
        invoice.refresh_from_db()

        self.assertEqual(invoice.total, decimal.Decimal('100.00'))
        
        # Add partial payment
        Payment.objects.create(invoice=invoice, amount=40.00, payment_date=timezone.now().date())
        # Payment signal should call update_payment_status
        invoice.refresh_from_db()
        self.assertEqual(invoice.paid_amount, decimal.Decimal('40.00'))
        self.assertNotEqual(invoice.status, 'paid')
        
        # Add rest of payment
        Payment.objects.create(invoice=invoice, amount=60.00, payment_date=timezone.now().date())
        invoice.refresh_from_db()
        self.assertEqual(invoice.paid_amount, decimal.Decimal('100.00'))
        self.assertEqual(invoice.status, 'paid')

class ExpenseModelTestCase(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(email='test2@invoices.com', password='password')
        self.business = Business.objects.create(name='Test Business 2', user=self.user)

    def test_expense_creation(self):
        expense = Expense.objects.create(
            business=self.business,
            description='Office Supplies',
            amount=150.50,
            date=timezone.now().date()
        )
        self.assertEqual(str(expense), 'Office Supplies - 150.5')
