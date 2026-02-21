from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
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
    
    # Mixin handles get_queryset (filtering by business and role)
    # Mixin handles perform_create (auto-attaching business and assigned_to)
    
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
        
        # Call Mixin's perform_create to handle business and role-based assignment
        super().perform_create(serializer)

    @action(detail=False, methods=['post'], url_path='bulk-assign')
    def bulk_assign(self, request):
        client_ids = request.data.get('client_ids', [])
        assigned_to_id = request.data.get('assigned_to')
        
        if not client_ids:
            return Response({"detail": "Müştəri seçilməyib."}, status=status.HTTP_400_BAD_REQUEST)
            
        # Ensure we only update clients belonging to the active business
        business = self.get_active_business()
        clients = Client.objects.filter(id__in=client_ids, business=business)
        
        updated_count = clients.update(assigned_to=assigned_to_id)
        
        return Response({
            "detail": f"{updated_count} müştəri uğurla təhkim edildi.",
            "updated_count": updated_count
        })
