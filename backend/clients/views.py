from rest_framework import viewsets, permissions
from rest_framework.exceptions import PermissionDenied
from .models import Client
from .serializers import ClientSerializer
from users.models import Business
from users.mixins import BusinessContextMixin
from users.plan_limits import check_client_limit
from users.permissions import IsRoleAuthorized

class ClientViewSet(BusinessContextMixin, viewsets.ModelViewSet):
    queryset = Client.objects.all() 
    serializer_class = ClientSerializer
    permission_classes = [permissions.IsAuthenticated, IsRoleAuthorized]
    
    def perform_create(self, serializer):
        limit_check = check_client_limit(self.request.user)
        if not limit_check['allowed']:
            raise PermissionDenied({
                "code": "plan_limit", 
                "detail": "Müştəri limitiniz dolub.",
                "limit": limit_check['limit'],
                "current": limit_check['current'],
                "upgrade_required": True
            })
            
        # Mixin's perform_create logic
        business = self.get_active_business()
        if business:
            serializer.save(business=business)
        else:
            raise PermissionDenied("Active business required")
