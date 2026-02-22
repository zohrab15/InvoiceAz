from django.test import TestCase
from django.contrib.auth import get_user_model
from users.models import Business
from inventory.models import Product
from invoices.models import Invoice, InvoiceItem
from clients.models import Client
from django.utils import timezone

User = get_user_model()

class InvoiceStockTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(email='test@example.com', password='password')
        self.business = Business.objects.create(name='Test Business', user=self.user)
        self.client = Client.objects.create(name='Test Client', business=self.business)
        self.product = Product.objects.create(
            business=self.business,
            name='Test Product',
            sku='TP-001',
            base_price=10.00,
            stock_quantity=10.00,
            min_stock_level=2.00
        )

    def test_invoice_item_reduction(self):
        """
        Test that creating an invoice item reduces the product stock.
        """
        # Create invoice
        invoice = Invoice.objects.create(
            business=self.business,
            client=self.client,
            invoice_date=timezone.now().date(),
            due_date=timezone.now().date(),
            status='draft'
        )
        
        # Create item with quantity 3
        InvoiceItem.objects.create(
            invoice=invoice,
            product=self.product,
            description=self.product.name,
            quantity=3,
            unit_price=self.product.base_price
        )
        
        # Refresh product from DB
        self.product.refresh_from_db()
        
        # Check stock: 10 - 3 = 7
        self.assertEqual(self.product.stock_quantity, 7.00)

    def test_invoice_item_update_reduction(self):
        """
        Test that updating an invoice item quantity adjusts the stock correctly.
        """
        invoice = Invoice.objects.create(
            business=self.business, client=self.client,
            invoice_date=timezone.now().date(), due_date=timezone.now().date()
        )
        item = InvoiceItem.objects.create(
            invoice=invoice, product=self.product,
            description=self.product.name, quantity=2,
            unit_price=self.product.base_price
        )
        self.product.refresh_from_db()
        self.assertEqual(self.product.stock_quantity, 8.00)

        # Update quantity from 2 to 5 (extra 3 should be subtracted)
        item.quantity = 5
        item.save()
        
        self.product.refresh_from_db()
        self.assertEqual(self.product.stock_quantity, 5.00)

        # Update quantity from 5 to 1 (4 should be added back)
        item.quantity = 1
        item.save()
        self.product.refresh_from_db()
        self.assertEqual(self.product.stock_quantity, 9.00)

    def test_invoice_item_delete_restoration(self):
        """
        Test that deleting an invoice item restores the stock.
        """
        invoice = Invoice.objects.create(
            business=self.business, client=self.client,
            invoice_date=timezone.now().date(), due_date=timezone.now().date()
        )
        item = InvoiceItem.objects.create(
            invoice=invoice, product=self.product,
            description=self.product.name, quantity=4,
            unit_price=self.product.base_price
        )
        self.product.refresh_from_db()
        self.assertEqual(self.product.stock_quantity, 6.00)

        # Delete item
        item.delete()
        self.product.refresh_from_db()
        self.assertEqual(self.product.stock_quantity, 10.00)
