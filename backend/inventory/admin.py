from django.contrib import admin
from .models import Product

@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ('name', 'sku', 'business', 'base_price', 'unit')
    list_filter = ('business', 'unit')
    search_fields = ('name', 'sku', 'description')
