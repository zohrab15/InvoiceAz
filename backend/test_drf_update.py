import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from clients.models import Client
from clients.serializers import ClientSerializer
from users.models import User, Business

user = User.objects.first()
biz = Business.objects.first()
c = Client.objects.create(name="Hello", business=biz, assigned_to=user)
print("Before:", c.assigned_to_id)

data = {"name": "Hello World"} # Missing assigned_to
serializer = ClientSerializer(c, data=data, partial=False) # PUT request
serializer.is_valid(raise_exception=True)
print("Validated data:", serializer.validated_data)

# Simulate popping from validated_data
if 'assigned_to' in serializer.validated_data:
    serializer.validated_data.pop('assigned_to')

serializer.save()

c.refresh_from_db()
print("After:", c.assigned_to_id)
