import os
import django
import sys

# Setup Django environment
sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth import authenticate
from users.models import User
from allauth.account.models import EmailAddress

def diagnose():
    email = 'demo@invoice.az'
    password = 'demo1234'
    print(f"--- Diagnosing Authentication: {email} ---")
    
    try:
        user = User.objects.get(email=email)
        print(f"User exists: YES")
        print(f"is_active: {user.is_active}")
        
        # Test standard authenticate
        print("Testing authenticate(email=email, password=password)...")
        auth_user = authenticate(email=email, password=password)
        if auth_user:
            print(f"AUTHENTICATE SUCCESS: {auth_user}")
        else:
            print("AUTHENTICATE FAILED: Returned None")
            
        # Check password directly
        pw_ok = user.check_password(password)
        print(f"check_password directly: {pw_ok}")
        
    except User.DoesNotExist:
        print(f"User {email} DOES NOT EXIST!")

if __name__ == "__main__":
    diagnose()
