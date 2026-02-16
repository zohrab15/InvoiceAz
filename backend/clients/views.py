from rest_framework import viewsets, permissions
from .models import Client
from .serializers import ClientSerializer
from users.models import Business
from users.mixins import BusinessContextMixin

class ClientViewSet(BusinessContextMixin, viewsets.ModelViewSet):
    # serializer_class and queryset required for Mixin super() calls
    queryset = Client.objects.all() 
    serializer_class = ClientSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    # Mixin handles get_queryset and perform_create
