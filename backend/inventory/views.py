import openpyxl
from decimal import Decimal
from django.db import transaction
from django.db.models import Sum, F, Q
from rest_framework import viewsets, status, permissions, pagination, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from .models import Product
from .serializers import ProductSerializer, ExcelUploadSerializer
from users.models import Business

from users.mixins import BusinessContextMixin
from users.permissions import IsRoleAuthorized
from users.plan_limits import check_product_limit
from rest_framework.exceptions import PermissionDenied

class StandardResultsSetPagination(pagination.PageNumberPagination):
    page_size = 50
    page_size_query_param = 'page_size'
    max_page_size = 1000

class ProductViewSet(BusinessContextMixin, viewsets.ModelViewSet):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    permission_classes = [permissions.IsAuthenticated, IsRoleAuthorized]
    pagination_class = StandardResultsSetPagination
    filter_backends = [filters.SearchFilter]
    search_fields = ['name', 'sku']

    def get_queryset(self):
        queryset = super().get_queryset()
        stock_status = self.request.query_params.get('stock_status')
        if stock_status == 'out_of_stock':
            queryset = queryset.filter(stock_quantity__lte=0)
        elif stock_status == 'low_stock':
            queryset = queryset.filter(stock_quantity__gt=0, stock_quantity__lte=F('min_stock_level'))
        elif stock_status == 'sufficient':
            queryset = queryset.filter(stock_quantity__gt=F('min_stock_level'))
        return queryset

    def perform_create(self, serializer):
        business = self.get_active_business()
        if not business:
            raise PermissionDenied("Active business required")
            
        limit_check = check_product_limit(self.request.user, business)
        if not limit_check['allowed']:
            raise PermissionDenied({
                "code": "plan_limit", 
                "detail": "Məhsul limitiniz dolub.",
                "limit": limit_check['limit'],
                "current": limit_check['current'],
                "upgrade_required": True
            })
            
        super().perform_create(serializer)

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

                # Check limit before processing
                limit_check = check_product_limit(request.user, business)
                if not limit_check['allowed']:
                    raise PermissionDenied({
                        "code": "plan_limit", 
                        "detail": "Məhsul limitiniz dolub.",
                        "limit": limit_check['limit'],
                        "current": limit_check['current'],
                        "upgrade_required": True
                    })
                
                # Check if Excel file itself exceeds the remaining limit
                remaining = limit_check['limit'] - limit_check['current'] if limit_check['limit'] else 999999
                if len(excel_data_map) > remaining:
                     raise PermissionDenied({
                        "code": "plan_limit", 
                        "detail": f"Excel faylındakı məhsul sayı ({len(excel_data_map)}) qalan limitinizi ({remaining}) aşır.",
                        "limit": limit_check['limit'],
                        "current": limit_check['current'],
                        "upgrade_required": True
                    })

                # 2. Prepare products to process (Overwrite Mode: Database stock is ignored)
                products_to_process = []
                for sku_key, data in excel_data_map.items():
                    # Overwrite Mode: We don't fetch or add existing DB stock. 
                    # Excel is the Source of Truth.
                    product = Product(
                        business=business,
                        sku=data['sku'],
                        name=data['name'],
                        description=data['description'],
                        base_price=data['base_price'],
                        unit=data['unit'],
                        stock_quantity=data['stock_quantity'],
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
                    "detail": f"{len(products_to_process)} məhsul uğurla işlənildi (Sinxronizasiya: Mövcud stoklar əvəzləndi)."
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
        
        # Get base queryset (business-filtered)
        # We manually use super().get_queryset() to avoid the stock_status filter 
        # defined in our own get_queryset(), so button counts show all categories.
        queryset = super(ProductViewSet, self).get_queryset().filter(business=business)
        
        # Apply search filters from query params (respect current search)
        queryset = self.filter_queryset(queryset)
        
        total_products = queryset.count()
        
        # Calculate total value for the filtered set
        total_value_data = queryset.aggregate(
            total_value=Sum(F('base_price') * F('stock_quantity'))
        )
        total_value = total_value_data['total_value'] or 0.00
        
        out_of_stock = queryset.filter(stock_quantity__lte=0).count()
        low_stock = queryset.filter(stock_quantity__gt=0, stock_quantity__lte=F('min_stock_level')).count()
        sufficient = queryset.filter(stock_quantity__gt=F('min_stock_level')).count()
        in_stock_count = queryset.filter(stock_quantity__gt=0).count()
        
        return Response({
            "total_products": total_products,
            "total_value": float(total_value),
            "out_of_stock": out_of_stock,
            "low_stock": low_stock,
            "sufficient": sufficient,
            "in_stock": in_stock_count
        })

    @action(detail=False, methods=['get'], url_path='all')
    def all_products(self, request):
        """
        Dropdownlar üçün bütün məhsulları səhifələmə olmadan qaytarır.
        """
        business = self.get_active_business()
        if not business:
            return Response({"detail": "Aktiv biznes seçilməyib."}, status=status.HTTP_400_BAD_REQUEST)
        
        products = Product.objects.filter(business=business)
        serializer = self.get_serializer(products, many=True)
        return Response(serializer.data)
