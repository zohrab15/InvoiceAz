from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ProductViewSet, WarehouseViewSet,
    StockMovementViewSet, PurchaseOrderViewSet,
    InventoryAdjustmentViewSet
)

router = DefaultRouter()
router.register(r'products', ProductViewSet, basename='product')
router.register(r'warehouses', WarehouseViewSet, basename='warehouse')
router.register(r'stock-movements', StockMovementViewSet, basename='stock-movement')
router.register(r'purchase-orders', PurchaseOrderViewSet, basename='purchase-order')
router.register(r'adjustments', InventoryAdjustmentViewSet, basename='adjustment')

urlpatterns = [
    path('', include(router.urls)),
]
