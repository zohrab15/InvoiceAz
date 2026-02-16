from django.utils.deprecation import MiddlewareMixin
from rest_framework.authentication import get_authorization_header

class BusinessContextMiddleware(MiddlewareMixin):
    def process_view(self, request, view_func, view_args, view_kwargs):
        from .models import Business  # Lazy import to avoid circular dependency
        
        # Skip if not authenticated (DRF auth happens before view, but middleware runs before DRF)
        # Actually, standard Django auth middleware runs before this.
        # But DRF Token auth happens inside the view dispatch.
        # So we might need to rely on request.user if it's already set by Django Session,
        # OR wait until view access. 
        
        # A safer approach for DRF is to do this in PERMISSION or distinct logic, 
        # but Middleware is good for global context if we use standard Django User.
        # For DRF, `request.user` might be AnonymousUser until DRF authentication runs.
        
        # However, for this project we are using standard Django Request flow compatibility.
        # Let's try to get business ID from header.
        
        business_id = request.headers.get('X-Business-ID')
        request.business = None

        if request.user.is_authenticated and business_id:
            try:
                business = Business.objects.get(id=business_id, user=request.user)
                if business.is_active:
                    request.business = business
            except Business.DoesNotExist:
                pass
        
        # If no header, we don't set request.business (Views will handle 400/403 if needed)
        return None
