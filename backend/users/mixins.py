from .models import Business, TeamMember
from rest_framework.exceptions import ValidationError
from django.db.models import Q

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
            # First, try to find if the user owns this business directly
            business = Business.objects.get(id=business_id, user=self.request.user, is_active=True)
            self.request._active_business = business
            self.request._is_team_member = False
            return business
        except Business.DoesNotExist:
            pass
            
        # If not the owner, check if they are a team member under the owner of this business
        try:
            business = Business.objects.get(id=business_id, is_active=True)
            team_member = TeamMember.objects.get(owner=business.user, user=self.request.user)
            self.request._active_business = business
            self.request._is_team_member = True
            return business
        except (Business.DoesNotExist, TeamMember.DoesNotExist):
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
            queryset = super().get_queryset().filter(business=business)
            
            # If the user is a team member, filter their visibility
            if getattr(self.request, '_is_team_member', False):
                model_name = queryset.model.__name__
                if model_name == 'Client':
                    # Only show clients assigned to this rep
                    queryset = queryset.filter(assigned_to=self.request.user)
                elif model_name == 'Invoice':
                    # Show invoices created by this rep, or attached to a client assigned to this rep
                    queryset = queryset.filter(
                        Q(created_by=self.request.user) | Q(client__assigned_to=self.request.user)
                    )
                # Other models (like generic Expenses or Inventory) might be entirely hidden
                # or require their own rules. Default: no further filtering if not Client/Invoice
            
            return queryset
            
        return super().get_queryset().none()

    def perform_create(self, serializer):
        """
        Override perform_create to automatically attach active business.
        """
        business = self.get_active_business()
        if not business:
            raise ValidationError({"detail": "Əməliyyat üçün Biznes Profili seçilməyib."})
        
        kwargs = {'business': business}
        
        # If they are a Team Member, auto-assign records they create to themselves
        if getattr(self.request, '_is_team_member', False):
            if hasattr(serializer.Meta.model, 'assigned_to'):
                kwargs['assigned_to'] = self.request.user
            elif hasattr(serializer.Meta.model, 'created_by'):
                kwargs['created_by'] = self.request.user
                
        serializer.save(**kwargs)
