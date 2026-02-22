import openpyxl
from decimal import Decimal
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
                # Use read_only=True and values_only=True for performance
                wb = openpyxl.load_workbook(file, read_only=True)
                sheet = wb.active
                
                # 1. Collect and aggregate data from Excel (Handle duplicates within the file)
                excel_data_map = {} # SKU -> combined data
                for row in sheet.iter_rows(min_row=2, values_only=True):
                    if not row or not any(row):
                        continue
                    
                    vals = list(row) + [None] * 7
                    name, desc, sku, price, unit, stock, min_stock = vals[0:7]
                    
                    if not name:
                        continue

                    # Fallback for SKU if missing (though SKU is unique_together with business)
                    sku_key = sku or f"NO-SKU-{name}"
                    
                    if sku_key not in excel_data_map:
                        excel_data_map[sku_key] = {
                            'name': name,
                            'description': desc,
                            'sku': sku,
                            'base_price': Decimal(str(price or 0)),
                            'unit': unit or 'pcs',
                            'stock_quantity': Decimal(str(stock or 0)),
                            'min_stock_level': Decimal(str(min_stock or 0))
                        }
                    else:
                        # Aggregate: Sum stock, update other fields from latest row
                        excel_data_map[sku_key]['stock_quantity'] += Decimal(str(stock or 0))
                        excel_data_map[sku_key]['name'] = name
                        excel_data_map[sku_key]['description'] = desc
                        excel_data_map[sku_key]['base_price'] = Decimal(str(price or 0))
                        excel_data_map[sku_key]['unit'] = unit or 'pcs'
                        excel_data_map[sku_key]['min_stock_level'] = Decimal(str(min_stock or 0))

                if not excel_data_map:
                    return Response({"detail": "Faylda yüklənə biləcək məhsul tapılmadı."}, status=status.HTTP_400_BAD_REQUEST)

                # 2. Fetch existing products for this business to apply Hybrid Model
                excel_skus = [s for s in excel_data_map.keys() if not s.startswith('NO-SKU-')]
                existing_products = {
                    p.sku: p for p in Product.objects.filter(business=business, sku__in=excel_skus)
                }

                products_to_process = []
                for sku_key, data in excel_data_map.items():
                    # Calculate final stock: (Database Stock) + (Sum of all rows in Excel)
                    db_stock = Decimal('0.00')
                    if sku_key in existing_products:
                        db_stock = existing_products[sku_key].stock_quantity
                    
                    product = Product(
                        business=business,
                        sku=data['sku'],
                        name=data['name'],
                        description=data['description'],
                        base_price=data['base_price'],
                        unit=data['unit'],
                        stock_quantity=db_stock + data['stock_quantity'],
                        min_stock_level=data['min_stock_level']
                    )
                    products_to_process.append(product)

                # 3. Execute bulk operation with conflict resolution
                with transaction.atomic():
                    Product.objects.bulk_create(
                        products_to_process,
                        update_conflicts=True,
                        unique_fields=['business', 'sku'],
                        update_fields=['name', 'description', 'base_price', 'unit', 'stock_quantity', 'min_stock_level']
                    )
                
                return Response({
                    "detail": f"{len(products_to_process)} məhsul uğurla işlənildi (Hibrid Model: Stoklar artırıldı)."
                }, status=status.HTTP_201_CREATED)
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
