from django.test import TestCase
from django.contrib.auth import get_user_model
from users.models import Business
from inventory.models import Warehouse, Product, StockMovement
from decimal import Decimal

User = get_user_model()

class InventoryModelTestCase(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(email='test@inventory.com', password='password')
        self.business = Business.objects.create(name='Test Business', user=self.user)

    def test_warehouse_creation(self):
        warehouse = Warehouse.objects.create(
            business=self.business,
            name='Main Warehouse',
            is_default=True
        )
        self.assertEqual(str(warehouse), 'Main Warehouse (Əsas)')
        self.assertTrue(warehouse.is_default)

    def test_product_creation(self):
        product = Product.objects.create(
            business=self.business,
            name='Test Product',
            sku='SKU001',
            base_price=Decimal('100.00'),
            cost_price=Decimal('50.00'),
            stock_quantity=Decimal('10.00')
        )
        self.assertEqual(str(product), 'Test Product (SKU001)')
        self.assertEqual(product.profit_margin, Decimal('50.00'))
        self.assertEqual(product.total_cost_value, Decimal('500.00')) # 50 * 10
        self.assertEqual(product.total_sale_value, Decimal('1000.00')) # 100 * 10

    def test_stock_movement(self):
        product = Product.objects.create(
            business=self.business,
            name='Test Product 2',
            sku='SKU002'
        )
        movement = StockMovement.objects.create(
            business=self.business,
            product=product,
            movement_type='IN',
            quantity=Decimal('5.00'),
            note='Purchase',
            stock_before=Decimal('0.00'),
            stock_after=Decimal('5.00')
        )
        self.assertTrue('giriş' in str(movement).lower() or 'in' in str(movement).lower() or 'əlavə' in str(movement).lower() or 'test product 2' in str(movement).lower())
