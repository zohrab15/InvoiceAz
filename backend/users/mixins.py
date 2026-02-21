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
            
            # 1. Direct check: user was invited by the business owner
            team_member = TeamMember.objects.filter(
                owner=business.user, user=self.request.user
            ).first()
            
            # 2. Hierarchical check: user was invited by a Manager (or other team member)
            #    who themselves belong to the business owner's team
            if not team_member:
                # Find all users who are team members of the business owner
                owner_team_user_ids = TeamMember.objects.filter(
                    owner=business.user
                ).values_list('user_id', flat=True)
                # Check if any of those team members invited the current user
                team_member = TeamMember.objects.filter(
                    owner_id__in=owner_team_user_ids, user=self.request.user
                ).first()
            
            if team_member:
                self.request._active_business = business
                self.request._is_team_member = True
                self.request._team_role = team_member.role
                return business
                
            return None
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
            queryset = super().get_queryset().filter(business=business)
            
            # If the user is a team member, filter their visibility
            if getattr(self.request, '_is_team_member', False):
                role = getattr(self.request, '_team_role', 'SALES_REP')
                model_name = queryset.model.__name__
                
                if role == 'MANAGER':
                    # Manager sees everything the owner sees
                    pass 
                
                elif role == 'ACCOUNTANT':
                    # Accountant sees financial stuff and clients
                    if model_name not in ['Invoice', 'Expense', 'Payment', 'Client']:
                        queryset = queryset.none()
                        
                elif role == 'INVENTORY_MANAGER':
                    # Inventory Manager sees only products/inventory
                    if model_name not in ['Product', 'InventoryTransaction', 'Category']:
                        queryset = queryset.none()
                        
                elif role == 'SALES_REP':
                    if model_name == 'Client':
                        # Only show clients assigned to this rep
                        queryset = queryset.filter(assigned_to=self.request.user)
                    elif model_name == 'Invoice':
                        # Show invoices created by this rep, or attached to a client assigned to this rep
                        # Also protect against returning invoices for which they have NO client access
                        queryset = queryset.filter(
                            Q(created_by=self.request.user) | Q(client__assigned_to=self.request.user)
                        ).distinct()
                    elif model_name == 'Product':
                        # Products are globally readable per the permissions fix, so don't filter them out here.
                        # (Business filter already applied at top of method)
                        pass
                    else:
                        queryset = queryset.none() # Default hide for Sales Rep
            
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
