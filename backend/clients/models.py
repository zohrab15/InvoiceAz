from django.db import models
from users.models import Business
from django.conf import settings

class Client(models.Model):
    business = models.ForeignKey(Business, on_delete=models.CASCADE, related_name='clients')
    name = models.CharField(max_length=255)
    # Contact Type (Person or Company) - inferred from fields or explicit? Docs say client_type
    CLIENT_TYPES = (
        ('individual', 'Individual'),
        ('company', 'Company'),
    )
    client_type = models.CharField(max_length=20, choices=CLIENT_TYPES, default='company')
    
    # Optional assignment to a Sales Rep (TeamMember's user)
    assigned_to = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='assigned_clients'
    )
    
    contact_person = models.CharField(max_length=255, blank=True, null=True)
    email = models.EmailField(blank=True, null=True)
    phone = models.CharField(max_length=20, blank=True, null=True)
    voen = models.CharField(max_length=20, blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    notes = models.TextField(blank=True, null=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name
