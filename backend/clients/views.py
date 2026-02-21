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
        business = self.get_active_business()
        limit_check = check_client_limit(self.request.user, business=business)
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

    def perform_update(self, serializer):
        # Prevent Sales Reps from changing or clearing the assigned_to field
        is_team_member = getattr(self.request, '_is_team_member', False)
        # If not a team member, they are the owner
        role = getattr(self.request, '_team_role', 'OWNER' if not is_team_member else None)

        if role not in ['OWNER', 'MANAGER']:
            # If they try to update, force it to remain whatever it currently is in the DB
            # We do this by dropping assigned_to from validated_data before saving
            if 'assigned_to' in serializer.validated_data:
                serializer.validated_data.pop('assigned_to')

        super().perform_update(serializer)

    @action(detail=False, methods=['post'], url_path='bulk-assign')
    def bulk_assign(self, request):
        client_ids = request.data.get('client_ids', [])
        assigned_to_id = request.data.get('assigned_to')
        
        if not client_ids:
            return Response({"detail": "Müştəri seçilməyib."}, status=status.HTTP_400_BAD_REQUEST)
            
        # Prepare assigned_to_id (handle empty string as None for unassignment)
        if not assigned_to_id:
            assigned_to_id = None
        else:
            # Security: Ensure the ID belongs to someone in this business's team
            from users.models import TeamMember
            business = self.get_active_business()
            if business:
                is_valid_member = TeamMember.objects.filter(owner=business.user, user_id=assigned_to_id).exists()
                # Also allow assigning to the business owner themselves
                if not is_valid_member and str(business.user_id) != str(assigned_to_id):
                    return Response({"detail": "Təhkim edilən istifadəçi komandanıza aid deyil."}, status=status.HTTP_400_BAD_REQUEST)
            
        # Ensure we only update clients belonging to the active business
        business = self.get_active_business()
        clients = Client.objects.filter(id__in=client_ids, business=business)
        
        updated_count = clients.update(assigned_to=assigned_to_id)
        
        return Response({
            "detail": f"{updated_count} müştəri uğurla təhkim edildi.",
            "updated_count": updated_count
        })
