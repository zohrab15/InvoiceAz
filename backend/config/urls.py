from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse

def health_check(request):
    return JsonResponse({"status": "ok", "message": "InvoiceAZ Backend is running"})

urlpatterns = [
    path('', health_check, name='health_check'),
    path('admin/', admin.site.urls),
    # Auth
    path('api/auth/', include('dj_rest_auth.urls')),
    path('api/auth/registration/', include('dj_rest_auth.registration.urls')),
    path('accounts/', include('allauth.urls')),
    # Apps
    path('api/clients/', include('clients.urls')),
    path('api/invoices/', include('invoices.urls')),
    path('api/users/', include('users.urls')),
    path('api/notifications/', include('notifications.urls')),
    path('api/inventory/', include('inventory.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
