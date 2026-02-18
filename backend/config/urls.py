from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse, HttpResponse
import os

def debug_static(request):
    path = settings.STATIC_ROOT
    if not os.path.exists(path):
        return HttpResponse(f"Static root {path} does not exist")
    try:
        content = os.listdir(path)
        return HttpResponse(f"Static root {path} contains: {content}")
    except Exception as e:
        return HttpResponse(f"Error listing {path}: {str(e)}")

def health_check(request):
    return JsonResponse({"status": "ok", "message": "InvoiceAZ Backend is running"})

urlpatterns = [
    path('', health_check, name='health_check'),
    path('debug-static/', debug_static, name='debug_static'),
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
