import os
import django
import sys

# Setup Django environment
sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from users.models import User
from allauth.account.models import EmailAddress

def diagnose():
    email = 'demo@invoice.az'
    print(f"--- Diagnosing User: {email} ---")
    
    try:
        user = User.objects.get(email=email)
        print(f"User exists: YES (ID: {user.id})")
        print(f"is_active: {user.is_active}")
        print(f"is_staff: {user.is_staff}")
        print(f"is_superuser: {user.is_superuser}")
        print(f"Date joined: {user.date_join if hasattr(user, 'date_join') else 'N/A'}")
        
        # Check password
        pw_ok = user.check_password('demo1234')
        print(f"Password 'demo1234' is correct: {pw_ok}")
        
        # Check allauth EmailAddress
        try:
            email_addr = EmailAddress.objects.filter(user=user, email=email).first()
            if email_addr:
                print(f"EmailAddress record: Found")
                print(f"  - Verified: {email_addr.verified}")
                print(f"  - Primary: {email_addr.primary}")
            else:
                print(f"EmailAddress record: NOT FOUND")
        except Exception as e:
            print(f"Error checking EmailAddress: {e}")
            
    except User.DoesNotExist:
        print(f"User {email} DOES NOT EXIST!")

if __name__ == "__main__":
    diagnose()
