from rest_framework import serializers
from .models import (
    Product, Warehouse, StockMovement,
    PurchaseOrder, PurchaseOrderItem, InventoryAdjustment,
    PurchaseOrderReceipt, PurchaseOrderReceiptItem
)


class ProductSerializer(serializers.ModelSerializer):
    profit_margin = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    total_cost_value = serializers.DecimalField(max_digits=14, decimal_places=2, read_only=True)
    total_sale_value = serializers.DecimalField(max_digits=14, decimal_places=2, read_only=True)
    warehouse_name = serializers.SerializerMethodField()

    def get_warehouse_name(self, obj):
        try:
            return obj.warehouse.name if obj.warehouse else None
        except Exception:
            return None

    class Meta:
        model = Product
        fields = [
            'id', 'business', 'name', 'description',
            'sku', 'base_price', 'cost_price', 'unit',
            'warehouse', 'warehouse_name',
            'stock_quantity', 'min_stock_level',
            'profit_margin', 'total_cost_value', 'total_sale_value',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'business', 'created_at', 'updated_at']


class ExcelUploadSerializer(serializers.Serializer):
    file = serializers.FileField()


class WarehouseSerializer(serializers.ModelSerializer):
    product_count = serializers.SerializerMethodField()

    class Meta:
        model = Warehouse
        fields = ['id', 'business', 'name', 'address', 'is_default', 'product_count', 'created_at', 'updated_at']
        read_only_fields = ['id', 'business', 'created_at', 'updated_at']

    def get_product_count(self, obj):
        return obj.products.filter(is_deleted=False).count()


class StockMovementSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    product_sku = serializers.CharField(source='product.sku', read_only=True)
    warehouse_name = serializers.CharField(source='warehouse.name', read_only=True, default=None)
    movement_type_display = serializers.CharField(source='get_movement_type_display', read_only=True)
    source_type_display = serializers.CharField(source='get_source_type_display', read_only=True)
    created_by_email = serializers.CharField(source='created_by.email', read_only=True, default=None)

    class Meta:
        model = StockMovement
        fields = [
            'id', 'business', 'product', 'product_name', 'product_sku',
            'warehouse', 'warehouse_name',
            'movement_type', 'movement_type_display',
            'source_type', 'source_type_display', 'source_id',
            'quantity', 'unit_cost',
            'stock_before', 'stock_after',
            'note', 'created_by', 'created_by_email', 'created_at'
        ]
        read_only_fields = ['id', 'business', 'created_by', 'created_at', 'stock_before', 'stock_after']


class PurchaseOrderItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    quantity_remaining = serializers.SerializerMethodField()
    line_total = serializers.DecimalField(max_digits=14, decimal_places=2, read_only=True)

    def get_quantity_remaining(self, obj):
        return obj.quantity_ordered - obj.quantity_received

    class Meta:
        model = PurchaseOrderItem
        fields = [
            'id', 'product', 'product_name',
            'quantity_ordered', 'quantity_received', 'quantity_remaining',
            'unit_cost', 'line_total'
        ]


class PurchaseOrderReceiptItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='po_item.product.name', read_only=True)

    class Meta:
        model = PurchaseOrderReceiptItem
        fields = ['id', 'po_item', 'product_name', 'quantity']


class PurchaseOrderReceiptSerializer(serializers.ModelSerializer):
    receipt_items = PurchaseOrderReceiptItemSerializer(many=True, read_only=True)
    received_by_email = serializers.CharField(source='received_by.email', read_only=True, default=None)

    class Meta:
        model = PurchaseOrderReceipt
        fields = ['id', 'received_by', 'received_by_email', 'received_at', 'note', 'receipt_items']


class PurchaseOrderSerializer(serializers.ModelSerializer):
    items = PurchaseOrderItemSerializer(many=True, read_only=True)
    receipts = PurchaseOrderReceiptSerializer(many=True, read_only=True)
    total_amount = serializers.DecimalField(max_digits=14, decimal_places=2, read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    warehouse_name = serializers.CharField(source='warehouse.name', read_only=True, default=None)
    created_by_email = serializers.CharField(source='created_by.email', read_only=True, default=None)

    class Meta:
        model = PurchaseOrder
        fields = [
            'id', 'business', 'supplier_name', 'supplier_contact',
            'warehouse', 'warehouse_name',
            'order_number', 'status', 'status_display',
            'order_date', 'expected_date', 'received_date',
            'note', 'total_amount', 'items', 'receipts',
            'created_by', 'created_by_email',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'business', 'created_by', 'created_at', 'updated_at']


class PurchaseOrderCreateSerializer(serializers.ModelSerializer):
    items = PurchaseOrderItemSerializer(many=True)

    class Meta:
        model = PurchaseOrder
        fields = [
            'supplier_name', 'supplier_contact', 'warehouse',
            'order_number', 'status', 'order_date', 'expected_date',
            'note', 'items'
        ]

    def create(self, validated_data):
        items_data = validated_data.pop('items')
        purchase_order = PurchaseOrder.objects.create(**validated_data)
        for item_data in items_data:
            PurchaseOrderItem.objects.create(purchase_order=purchase_order, **item_data)
        return purchase_order

    def update(self, instance, validated_data):
        items_data = validated_data.pop('items', None)
        
        # Update PO fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        # Update items if provided
        if items_data is not None:
            # Simple approach: delete existing and recreate
            # This is safe because we only allow edits when no receipts exist
            instance.items.all().delete()
            for item_data in items_data:
                PurchaseOrderItem.objects.create(purchase_order=instance, **item_data)
        
        return instance


class InventoryAdjustmentSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    warehouse_name = serializers.CharField(source='warehouse.name', read_only=True, default=None)
    reason_display = serializers.CharField(source='get_reason_display', read_only=True)
    difference = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    created_by_email = serializers.CharField(source='created_by.email', read_only=True, default=None)

    class Meta:
        model = InventoryAdjustment
        fields = [
            'id', 'business', 'product', 'product_name',
            'warehouse', 'warehouse_name',
            'old_quantity', 'new_quantity', 'difference',
            'reason', 'reason_display', 'note',
            'created_by', 'created_by_email', 'created_at'
        ]
        read_only_fields = ['id', 'business', 'created_by', 'created_at', 'old_quantity']
