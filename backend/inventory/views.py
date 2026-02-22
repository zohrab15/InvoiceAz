import openpyxl
from django.db import transaction
from django.db.models import Sum, F
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from .models import Product
from .serializers import ProductSerializer, ExcelUploadSerializer
from users.models import Business

from users.mixins import BusinessContextMixin
from users.permissions import IsRoleAuthorized

class ProductViewSet(BusinessContextMixin, viewsets.ModelViewSet):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    permission_classes = [permissions.IsAuthenticated, IsRoleAuthorized]

    @action(detail=False, methods=['post'], url_path='upload-excel')
    def upload_excel(self, request):
        serializer = ExcelUploadSerializer(data=request.data)
        if serializer.is_valid():
            file = serializer.validated_data['file']
            
            # Use mixin helper for business to ensure consistency and isolation
            business = self.get_active_business()
            if not business:
                return Response({"detail": "Aktiv biznes seçilməyib."}, status=status.HTTP_400_BAD_REQUEST)

            try:
                wb = openpyxl.load_workbook(file, read_only=True)
                sheet = wb.active
                
                products_to_process = []
                # Assuming Header: Name, Description, SKU, Price, Unit, Stock, Min Stock
                # Skip header row
                for row in sheet.iter_rows(min_row=2, values_only=True):
                    if not row or not any(row):
                        continue
                        
                    # Extract values with defaults
                    # row could have varying lengths, so we pad it
                    vals = list(row) + [None] * 7
                    name, desc, sku, price, unit, stock, min_stock = vals[0:7]
                    
                    if not name: # Skip rows without a name
                        continue
                    
                    # Create product instance for bulk processing
                    product = Product(
                        business=business,
                        sku=sku,
                        name=name,
                        description=desc,
                        base_price=price or 0.00,
                        unit=unit or 'pcs',
                        stock_quantity=stock or 0.00,
                        min_stock_level=min_stock or 0.00
                    )
                    products_to_process.append(product)
                
                if not products_to_process:
                    return Response({"detail": "Faylda yüklənə biləcək məhsul tapılmadı."}, status=status.HTTP_400_BAD_REQUEST)

                # Execute bulk operation
                with transaction.atomic():
                    # Django 4.1+ supports update_conflicts
                    Product.objects.bulk_create(
                        products_to_process,
                        update_conflicts=True,
                        unique_fields=['business', 'sku'],
                        update_fields=['name', 'description', 'base_price', 'unit', 'stock_quantity', 'min_stock_level']
                    )
                
                return Response({"detail": f"{len(products_to_process)} məhsul uğurla yükləndi."}, status=status.HTTP_201_CREATED)
            except Exception as e:
                return Response({"detail": f"Excel oxunarkən xəta baş verdi: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'], url_path='lookup')
    def lookup(self, request):
        sku = request.query_params.get('sku')
        business = self.get_active_business()
        if not business:
             return Response({"detail": "SKU və Business ID mütləqdir."}, status=status.HTTP_400_BAD_REQUEST)
            
        product = get_object_or_404(Product, business=business, sku=sku)
        serializer = self.get_serializer(product)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], url_path='stats')
    def stats(self, request):
        business = self.get_active_business()
        if not business:
            return Response({"detail": "Aktiv biznes seçilməyib."}, status=status.HTTP_400_BAD_REQUEST)
        
        products = Product.objects.filter(business=business)
        
        total_products = products.count()
        
        # Calculate total value: Sum of (base_price * stock_quantity)
        total_value_data = products.aggregate(
            total_value=Sum(F('base_price') * F('stock_quantity'))
        )
        total_value = total_value_data['total_value'] or 0.00
        
        out_of_stock = products.filter(stock_quantity__lte=0).count()
        low_stock = products.filter(stock_quantity__gt=0, stock_quantity__lte=F('min_stock_level')).count()
        
        return Response({
            "total_products": total_products,
            "total_value": float(total_value),
            "out_of_stock": out_of_stock,
            "low_stock": low_stock
        })
