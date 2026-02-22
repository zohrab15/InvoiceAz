import openpyxl
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
                wb = openpyxl.load_workbook(file)
                sheet = wb.active
                
                products_created = 0
                # Assuming Header: Name, Description, SKU, Price, Unit
                # Skip header row
                for row in sheet.iter_rows(min_row=2, values_only=True):
                    name, desc, sku, price, unit, stock, min_stock = (row + (None, None, None, None, None, None, None))[0:7]
                    
                    if not name: # Skip rows without a name
                        continue
                    
                    Product.objects.update_or_create(
                        business=business,
                        sku=sku,
                        defaults={
                            'name': name,
                            'description': desc,
                            'base_price': price or 0.00,
                            'unit': unit or 'pcs',
                            'stock_quantity': stock or 0.00,
                            'min_stock_level': min_stock or 0.00
                        }
                    )
                    products_created += 1
                
                return Response({"detail": f"{products_created} məhsul uğurla yükləndi."}, status=status.HTTP_201_CREATED)
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
        
        products = self.get_queryset()
        
        total_products = products.count()
        
        # Calculate total value: Sum of (base_price * stock_quantity)
        # We use F expressions to perform the calculation at the database level
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
