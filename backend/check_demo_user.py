
import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()
from users.models import User
try:
    user = User.objects.get(email='demo_user@invoice.az')
    print(f"Demo user exists: {user.email}")
except User.DoesNotExist:
    print("Demo user DOES NOT exist")
