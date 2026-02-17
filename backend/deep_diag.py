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
    print("--- Listing All Users ---")
    for u in User.objects.all():
        print(f"ID: {u.id} | Email: {u.email} | Active: {u.is_active} | Staff: {u.is_staff}")
    
    email = 'demo_user@invoice.az'
    password = 'demopassword123'
    print(f"\n--- Testing Authentication: {email} ---")
    
    try:
        user = User.objects.get(email=email)
        print(f"User exists: YES")
        
        # Test standard authenticate
        auth_user = authenticate(email=email, password=password)
        if auth_user:
            print(f"AUTHENTICATE SUCCESS: {auth_user}")
        else:
            print("AUTHENTICATE FAILED: Returned None")
            
        # Check allauth EmailAddress
        email_addr = EmailAddress.objects.filter(user=user, email=email).first()
        if email_addr:
            print(f"EmailAddress record: Found (Verified: {email_addr.verified})")
        else:
            print(f"EmailAddress record: NOT FOUND")
            
    except User.DoesNotExist:
        print(f"User {email} DOES NOT EXIST!")

if __name__ == "__main__":
    diagnose()
