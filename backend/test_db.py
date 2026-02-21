import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from clients.models import Client
for c in Client.objects.all():
    print(f"Client: {c.name}, Assigned To: {c.assigned_to_id}")
