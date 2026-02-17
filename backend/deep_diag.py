import os
import django
import sys

# Setup Django environment
sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth import authenticate, get_backends
from users.models import User
from allauth.account.models import EmailAddress

def diagnose():
    email = 'demo_user@invoice.az'
    password = 'demopassword123'
    
    print("--- Listing All Users ---")
    for u in User.objects.all():
        print(f"ID: {u.id} | Email: {u.email} | Active: {u.is_active}")
    
    print(f"\n--- Testing Authentication for: {email} ---")
    
    try:
        user = User.objects.get(email=email)
        print(f"User found in DB: YES")
        
        print("\nTesting get_backends()...")
        for backend in get_backends():
            print(f"Backend: {backend}")
            try:
                # allauth backend needs request or None as first arg
                auth_user = backend.authenticate(None, email=email, password=password)
                if auth_user:
                    print(f"  Result: SUCCESS")
                else:
                    print(f"  Result: FAILED (Returned None)")
            except Exception as e:
                print(f"  Result: ERROR ({e})")
                
        # Test standard authenticate
        print("\nTesting django.contrib.auth.authenticate()...")
        auth_user = authenticate(email=email, password=password)
        if auth_user:
            print(f"RESULT: SUCCESS ({auth_user})")
        else:
            print("RESULT: FAILED")
            
    except User.DoesNotExist:
        print(f"User {email} DOES NOT EXIST!")

if __name__ == "__main__":
    diagnose()
