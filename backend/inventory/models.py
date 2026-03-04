from django.db import models
from django.conf import settings
from decimal import Decimal

from utils.models import SoftDeleteModel


class Warehouse(SoftDeleteModel):
    """Anbar / Məkan - çoxsaylı anbar dəstəyi."""
    business = models.ForeignKey('users.Business', on_delete=models.CASCADE, related_name='warehouses')
    name = models.CharField(max_length=255, help_text="Anbar adı (məs: Əsas Anbar, Dükan #2)")
    address = models.TextField(blank=True, null=True)
    is_default = models.BooleanField(default=False, help_text="Əsas anbar kimi istifadə olunsun?")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-is_default', 'name']

    def __str__(self):
        return f"{self.name} ({'Əsas' if self.is_default else 'Əlavə'})"


class Product(SoftDeleteModel):
    UNIT_CHOICES = [
        ('pcs', 'Ədəd'),
        ('kg', 'Kq'),
        ('m', 'Metr'),
        ('l', 'Litr'),
        ('service', 'Xidmət'),
    ]

    business = models.ForeignKey('users.Business', on_delete=models.CASCADE, related_name='products')
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    sku = models.CharField(max_length=100, blank=True, null=True, help_text="SKU və ya Barcode")
    base_price = models.DecimalField(max_digits=12, decimal_places=2, default=0.00, help_text="Satış qiyməti")
    cost_price = models.DecimalField(max_digits=12, decimal_places=2, default=0.00, help_text="Mayalıq / alış qiyməti")
    unit = models.CharField(max_length=20, choices=UNIT_CHOICES, default='pcs')
    warehouse = models.ForeignKey(Warehouse, on_delete=models.SET_NULL, null=True, blank=True, related_name='products', help_text="Məhsulun saxlandığı anbar")

    # Stock management
    stock_quantity = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    min_stock_level = models.DecimalField(max_digits=12, decimal_places=2, default=0.00, help_text="Bildiriş üçün minimum miqdar")

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('business', 'sku')
        ordering = ['name']

    def __str__(self):
        return f"{self.name} ({self.sku})" if self.sku else self.name

    @property
    def profit_margin(self):
        """Hər vahid üzrə qazanc."""
        try:
            if hasattr(self, 'cost_price') and hasattr(self, 'base_price'):
                if self.cost_price and self.cost_price > 0:
                    return self.base_price - self.cost_price
        except Exception:
            pass
        return None

    @property
    def total_cost_value(self):
        """Anbardakı bu məhsulun ümumi maya dəyəri."""
        try:
            if hasattr(self, 'cost_price') and hasattr(self, 'stock_quantity'):
                return self.cost_price * self.stock_quantity
        except Exception:
            pass
        return Decimal('0.00')

    @property
    def total_sale_value(self):
        """Anbardakı bu məhsulun ümumi satış dəyəri."""
        try:
            if hasattr(self, 'base_price') and hasattr(self, 'stock_quantity'):
                return self.base_price * self.stock_quantity
        except Exception:
            pass
        return Decimal('0.00')


class StockMovement(models.Model):
    """Stok hərəkətləri jurnalı - hər bir dəyişikliyi izləyir."""
    MOVEMENT_TYPES = [
        ('IN', 'Giriş (Alış)'),
        ('OUT', 'Çıxış (Satış)'),
        ('ADJUSTMENT_PLUS', 'Düzəliş (+)'),
        ('ADJUSTMENT_MINUS', 'Düzəliş (-)'),
        ('TRANSFER', 'Anbarlar arası köçürmə'),
        ('RETURN', 'Geri qaytarma'),
        ('WRITE_OFF', 'Silinmə (Xarab/İtkili)'),
    ]

    SOURCE_TYPES = [
        ('INVOICE', 'Faktura'),
        ('PURCHASE', 'Alış Sifarişi'),
        ('ADJUSTMENT', 'İnventarizasiya'),
        ('MANUAL', 'Əl ilə dəyişiklik'),
        ('TRANSFER', 'Köçürmə'),
    ]

    business = models.ForeignKey('users.Business', on_delete=models.CASCADE, related_name='stock_movements')
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='movements')
    warehouse = models.ForeignKey(Warehouse, on_delete=models.SET_NULL, null=True, blank=True, related_name='movements')

    movement_type = models.CharField(max_length=20, choices=MOVEMENT_TYPES)
    source_type = models.CharField(max_length=20, choices=SOURCE_TYPES, default='MANUAL')
    source_id = models.PositiveIntegerField(null=True, blank=True, help_text="Mənbə sənədin ID-si (Faktura, Alış sifarişi və s.)")

    quantity = models.DecimalField(max_digits=12, decimal_places=2, help_text="Hərəkət miqdarı (həmişə müsbət)")
    unit_cost = models.DecimalField(max_digits=12, decimal_places=2, default=0.00, help_text="Vahid maya dəyəri")

    stock_before = models.DecimalField(max_digits=12, decimal_places=2, help_text="Hərəkətdən əvvəlki stok")
    stock_after = models.DecimalField(max_digits=12, decimal_places=2, help_text="Hərəkətdən sonrakı stok")

    note = models.TextField(blank=True, null=True, help_text="Qeyd / Şərh")
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.get_movement_type_display()} | {self.product.name} | {self.quantity}"


class PurchaseOrder(SoftDeleteModel):
    """Alış sifarişi / Mal qəbulu sənədi."""
    STATUS_CHOICES = [
        ('DRAFT', 'Qaralama'),
        ('ORDERED', 'Sifariş verildi'),
        ('RECEIVED', 'Qəbul edildi'),
        ('PARTIAL', 'Qismən qəbul'),
        ('CANCELLED', 'Ləğv edildi'),
    ]

    business = models.ForeignKey('users.Business', on_delete=models.CASCADE, related_name='purchase_orders')
    supplier_name = models.CharField(max_length=255, help_text="Təchizatçı adı")
    supplier_contact = models.CharField(max_length=255, blank=True, null=True)
    warehouse = models.ForeignKey(Warehouse, on_delete=models.SET_NULL, null=True, blank=True, related_name='purchase_orders')

    order_number = models.CharField(max_length=50, blank=True, null=True, help_text="Sifariş nömrəsi")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='DRAFT')
    order_date = models.DateField(help_text="Sifariş tarixi")
    expected_date = models.DateField(null=True, blank=True, help_text="Gözlənilən gəliş tarixi")
    received_date = models.DateField(null=True, blank=True, help_text="Faktiki qəbul tarixi")

    note = models.TextField(blank=True, null=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"PO-{self.id} | {self.supplier_name} ({self.get_status_display()})"

    @property
    def total_amount(self):
        return sum(item.line_total for item in self.items.all())


class PurchaseOrderItem(models.Model):
    """Alış sifarişindəki hər bir mal sətri."""
    purchase_order = models.ForeignKey(PurchaseOrder, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='purchase_items')

    quantity_ordered = models.DecimalField(max_digits=12, decimal_places=2, help_text="Sifariş edilən miqdar")
    quantity_received = models.DecimalField(max_digits=12, decimal_places=2, default=0.00, help_text="Qəbul edilən miqdar")
    unit_cost = models.DecimalField(max_digits=12, decimal_places=2, help_text="Vahid alış qiyməti")

    class Meta:
        ordering = ['id']


class PurchaseOrderReceipt(models.Model):
    """Mal qəbulu hadisəsi (GRN - Goods Receipt Note)."""
    purchase_order = models.ForeignKey(PurchaseOrder, on_delete=models.CASCADE, related_name='receipts')
    received_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    received_at = models.DateTimeField(auto_now_add=True)
    note = models.TextField(blank=True, null=True)

    class Meta:
        ordering = ['-received_at']

    def __str__(self):
        return f"Receipt for PO-{self.purchase_order_id} at {self.received_at}"


class PurchaseOrderReceiptItem(models.Model):
    """Hər qəbulda daxil olan spesifik mallar."""
    receipt = models.ForeignKey(PurchaseOrderReceipt, on_delete=models.CASCADE, related_name='receipt_items')
    po_item = models.ForeignKey(PurchaseOrderItem, on_delete=models.CASCADE, related_name='history_items')
    quantity = models.DecimalField(max_digits=12, decimal_places=2)

    def __str__(self):
        return f"{self.quantity} of {self.po_item.product.name}"


class InventoryAdjustment(models.Model):
    """İnventarizasiya / Siyahıyaalma düzəlişi."""
    REASON_CHOICES = [
        ('COUNT', 'Fiziki sayım'),
        ('DAMAGE', 'Xarab olma'),
        ('LOSS', 'İtki / Oğurluq'),
        ('FOUND', 'Tapıntı'),
        ('EXPIRY', 'Yararlılıq müddəti bitib'),
        ('OTHER', 'Digər'),
    ]

    business = models.ForeignKey('users.Business', on_delete=models.CASCADE, related_name='adjustments')
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='adjustments')
    warehouse = models.ForeignKey(Warehouse, on_delete=models.SET_NULL, null=True, blank=True, related_name='adjustments')

    old_quantity = models.DecimalField(max_digits=12, decimal_places=2, help_text="Sistemdəki qalıq")
    new_quantity = models.DecimalField(max_digits=12, decimal_places=2, help_text="Real sayılmış qalıq")
    reason = models.CharField(max_length=20, choices=REASON_CHOICES, default='COUNT')
    note = models.TextField(blank=True, null=True)

    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        diff = self.new_quantity - self.old_quantity
        sign = '+' if diff >= 0 else ''
        return f"{self.product.name}: {sign}{diff} ({self.get_reason_display()})"

    @property
    def difference(self):
        return self.new_quantity - self.old_quantity
