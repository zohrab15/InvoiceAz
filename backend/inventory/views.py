import openpyxl
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from .models import Product
from .serializers import ProductSerializer, ExcelUploadSerializer
from users.models import Business

class ProductViewSet(viewsets.ModelViewSet):
    serializer_class = ProductSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Product.objects.filter(business__user=self.request.user)

    def perform_create(self, serializer):
        # Ensure business belongs to user
        business_id = self.request.data.get('business')
        business = get_object_or_404(Business, id=business_id, user=self.request.user)
        serializer.save(business=business)

    @action(detail=False, methods=['post'], url_path='upload-excel')
    def upload_excel(self, request):
        serializer = ExcelUploadSerializer(data=request.data)
        if serializer.is_valid():
            file = serializer.validated_data['file']
            business_id = request.data.get('business')
            business = get_object_or_404(Business, id=business_id, user=request.user)

            try:
                wb = openpyxl.load_workbook(file)
                sheet = wb.active
                
                products_created = 0
                # Assuming Header: Name, Description, SKU, Price, Unit
                # Skip header row
                for row in sheet.iter_rows(min_row=2, values_only=True):
                    if not row[0]: # Skip empty rows
                        continue
                        
                    name, desc, sku, price, unit = row[0:5]
                    
                    Product.objects.update_or_create(
                        business=business,
                        sku=sku,
                        defaults={
                            'name': name,
                            'description': desc,
                            'base_price': price or 0.00,
                            'unit': unit or 'pcs'
                        }
                    )
                    products_created += 1
                
                return Response({"detail": f"{products_created} məhsul uğurla yükləndi."}, status=status.STATUS_201_CREATED)
            except Exception as e:
                return Response({"detail": f"Excel oxunarkən xəta baş verdi: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'], url_path='lookup')
    def lookup(self, request):
        sku = request.query_params.get('sku')
        business_id = request.query_params.get('business')
        
        if not sku or not business_id:
            return Response({"detail": "SKU və Business ID mütləqdir."}, status=status.HTTP_400_BAD_REQUEST)
            
        product = get_object_or_404(Product, business__id=business_id, business__user=request.user, sku=sku)
        serializer = self.get_serializer(product)
        return Response(serializer.data)
