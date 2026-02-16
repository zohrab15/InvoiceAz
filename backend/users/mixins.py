from .models import Business
from rest_framework.exceptions import ValidationError

class BusinessContextMixin:
    """
    Mixin to retrieve the active business from the X-Business-ID header.
    Must be used in a ViewSet where request.user is authenticated.
    """
    def get_active_business(self):
        # Return cached valid business if already resolved
        if hasattr(self.request, '_active_business'):
            return self.request._active_business

        business_id = self.request.headers.get('X-Business-ID')
        if not business_id:
            business_id = self.request.query_params.get('business_id')

        if not business_id:
            return None

        try:
            business = Business.objects.get(id=business_id, user=self.request.user, is_active=True)
            self.request._active_business = business # Cache it
            return business
        except Business.DoesNotExist:
            return None

    def get_queryset(self):
        """
        Override get_queryset to automatically filter by active business.
        """
        # For Swagger schema generation or unauthenticated requests, return nothing
        if getattr(self, 'swagger_fake_view', False) or not self.request.user.is_authenticated:
            return self.queryset.none() if self.queryset is not None else []

        business = self.get_active_business()
        if business:
            # Assumes the model has a 'business' field
            return super().get_queryset().filter(business=business)
        return super().get_queryset().none()

    def perform_create(self, serializer):
        """
        Override perform_create to automatically attach active business.
        """
        business = self.get_active_business()
        if not business:
            raise ValidationError({"detail": "Əməliyyat üçün Biznes Profili seçilməyib."})
        
        serializer.save(business=business)
