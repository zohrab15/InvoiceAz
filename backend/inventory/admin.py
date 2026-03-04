from django.contrib import admin
from .models import (
    Product, Warehouse, StockMovement,
    PurchaseOrder, PurchaseOrderItem, InventoryAdjustment
)


@admin.register(Warehouse)
class WarehouseAdmin(admin.ModelAdmin):
    list_display = ('name', 'business', 'is_default', 'created_at')
    list_filter = ('is_default', 'business')


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ('name', 'sku', 'base_price', 'cost_price', 'stock_quantity', 'warehouse', 'business')
    list_filter = ('business', 'warehouse', 'unit')
    search_fields = ('name', 'sku')


@admin.register(StockMovement)
class StockMovementAdmin(admin.ModelAdmin):
    list_display = ('product', 'movement_type', 'quantity', 'stock_before', 'stock_after', 'source_type', 'created_at')
    list_filter = ('movement_type', 'source_type', 'business')
    readonly_fields = ('stock_before', 'stock_after', 'created_at')


class PurchaseOrderItemInline(admin.TabularInline):
    model = PurchaseOrderItem
    extra = 1


@admin.register(PurchaseOrder)
class PurchaseOrderAdmin(admin.ModelAdmin):
    list_display = ('id', 'supplier_name', 'status', 'order_date', 'business')
    list_filter = ('status', 'business')
    inlines = [PurchaseOrderItemInline]


@admin.register(InventoryAdjustment)
class InventoryAdjustmentAdmin(admin.ModelAdmin):
    list_display = ('product', 'old_quantity', 'new_quantity', 'reason', 'created_at')
    list_filter = ('reason', 'business')
    readonly_fields = ('old_quantity', 'created_at')
