from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import InvoiceViewSet, ExpenseViewSet, PaymentViewSet
from .analytics_views import PaymentAnalyticsView, ProblematicInvoicesView, ForecastAnalyticsView, TaxAnalyticsView

router = DefaultRouter()
router.register(r'expenses', ExpenseViewSet, basename='expense')
router.register(r'payments', PaymentViewSet, basename='payment')
router.register(r'', InvoiceViewSet, basename='invoice')

urlpatterns = [
    path('analytics/payments/', PaymentAnalyticsView.as_view(), name='payment-analytics'),
    path('analytics/issues/', ProblematicInvoicesView.as_view(), name='issue-analytics'),
    path('analytics/forecast/', ForecastAnalyticsView.as_view(), name='forecast-analytics'),
    path('analytics/tax/', TaxAnalyticsView.as_view(), name='tax-analytics'),
    path('', include(router.urls)),
]
