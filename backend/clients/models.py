from django.db import models
from users.models import Business

class Client(models.Model):
    business = models.ForeignKey(Business, on_delete=models.CASCADE, related_name='clients')
    name = models.CharField(max_length=255)
    # Contact Type (Person or Company) - inferred from fields or explicit? Docs say client_type
    CLIENT_TYPES = (
        ('individual', 'Individual'),
        ('company', 'Company'),
    )
    client_type = models.CharField(max_length=20, choices=CLIENT_TYPES, default='company')
    
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
