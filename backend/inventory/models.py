from django.db import models
from django.conf import settings

class Product(models.Model):
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
    base_price = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    unit = models.CharField(max_length=20, choices=UNIT_CHOICES, default='pcs')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('business', 'sku')
        ordering = ['name']

    def __str__(self):
        return f"{self.name} ({self.sku})" if self.sku else self.name
