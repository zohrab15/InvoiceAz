from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Notification, NotificationSetting, ActivityLog
from .serializers import NotificationSerializer, NotificationSettingSerializer, ActivityLogSerializer

class NotificationViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = Notification.objects.filter(user=self.request.user)
        
        # Get business from query param or custom header
        business_id = self.request.query_params.get('business_id') or self.request.headers.get('X-Business-ID')
        
        if business_id:
            queryset = queryset.filter(business_id=business_id)
            
        return queryset

    @action(detail=False, methods=['post'])
    def mark_all_as_read(self, request):
        Notification.objects.filter(user=request.user, is_read=False).update(is_read=True)
        return Response({"status": "ok"})

    @action(detail=True, methods=['post'])
    def mark_as_read(self, request, pk=None):
        notification = self.get_object()
        notification.is_read = True
        notification.save()
        return Response({"status": "ok"})

class NotificationSettingViewSet(viewsets.ModelViewSet):
    serializer_class = NotificationSettingSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return NotificationSetting.objects.filter(user=self.request.user)

    def get_object(self):
        # We ensure settings exist for the user
        obj, created = NotificationSetting.objects.get_or_create(user=self.request.user)
        return obj

    @action(detail=False, methods=['get', 'patch'])
    def me(self, request):
        settings = self.get_object()
        if request.method == 'PATCH':
            serializer = self.get_serializer(settings, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response(serializer.data)
        
        serializer = self.get_serializer(settings)
        return Response(serializer.data)

class ActivityLogViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = ActivityLogSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        business_id = self.request.query_params.get('business_id') or self.request.headers.get('X-Business-ID')
        if not business_id:
            return ActivityLog.objects.none()

        # Only Owner or Manager should see this
        user = self.request.user
        from users.models import TeamMember, Business
        
        try:
            business = Business.objects.get(id=business_id)
        except Business.DoesNotExist:
            return ActivityLog.objects.none()

        if user != business.user:
            try:
                member = TeamMember.objects.get(owner=business.user, user=user)
                if member.role not in ['OWNER', 'MANAGER']:
                    return ActivityLog.objects.none()
            except TeamMember.DoesNotExist:
                return ActivityLog.objects.none()
                
        return ActivityLog.objects.filter(business_id=business_id)
