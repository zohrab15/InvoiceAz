import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from clients.models import Client

clients = Client.objects.all()
print("CLIENTS DUMP:")
for c in clients:
    assigned = c.assigned_to.email if c.assigned_to else "None"
    print(f"ID: {c.id} | Name: {c.name} | Assigned: {assigned}")
