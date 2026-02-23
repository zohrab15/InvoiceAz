from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import NotificationViewSet, NotificationSettingViewSet, ActivityLogViewSet

router = DefaultRouter()
router.register(r'settings', NotificationSettingViewSet, basename='notification-settings')
router.register(r'activity-logs', ActivityLogViewSet, basename='activity-logs')
router.register(r'', NotificationViewSet, basename='notification')

urlpatterns = [
    path('', include(router.urls)),
]
