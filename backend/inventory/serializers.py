from rest_framework import serializers
from .models import Product

class ProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = [
            'id', 'business', 'name', 'description', 
            'sku', 'base_price', 'unit', 
            'stock_quantity', 'min_stock_level',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'business', 'created_at', 'updated_at']

class ExcelUploadSerializer(serializers.Serializer):
    file = serializers.FileField()
