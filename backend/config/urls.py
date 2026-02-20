from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse, HttpResponse
import os

def debug_static(request):
    import os
    from django.conf import settings
    from pathlib import Path
    
    results = []
    results.append(f"__file__: {__file__}")
    results.append(f"BASE_DIR: {settings.BASE_DIR}")
    results.append(f"STATIC_ROOT: {settings.STATIC_ROOT}")
    results.append(f"STATIC_URL: {settings.STATIC_URL}")
    
    path = settings.STATIC_ROOT
    if os.path.exists(path):
        results.append(f"Static root exists! Contents: {str(os.listdir(path)[:10])}")
    else:
        results.append("Static root DOES NOT EXIST")
        
    # Brute force search
    results.append("Starting brute force search for 'staticfiles'...")
    for root, dirs, files in os.walk("/opt/render/project/src"):
        if "staticfiles" in dirs:
            results.append(f"FOUND staticfiles at: {os.path.join(root, 'staticfiles')}")
            
    return HttpResponse("<br>".join(results))

def health_check(request):
    return JsonResponse({"status": "ok", "message": "InvoiceAZ Backend is running", "version": "v1.2.0-themes"})

urlpatterns = [
    path('', health_check, name='health_check'),
    path('api/', health_check, name='api_health_check'),
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

# Serve media files in production (Temporary for Render demo)
urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

if settings.DEBUG:
    urlpatterns += [path('debug-static/', debug_static, name='debug_static')]
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
