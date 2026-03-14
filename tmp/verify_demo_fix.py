
import os
import sys
import django

# Set up Django environment
sys.path.append(r'c:\Users\mirza\.gemini\antigravity\scratch\InvoiceAZ\backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from users.models import User
from users.plan_limits import get_full_plan_status

def test_demo_user_status():
    demo_email = 'demo_user@invoice.az'
    try:
        user = User.objects.get(email=demo_email)
        print(f"Testing for user: {user.email}")
        
        status = get_full_plan_status(user)
        
        print(f"Plan: {status.get('plan')}")
        print(f"Label: {status.get('label')}")
        
        assert status.get('plan') == 'premium', f"Expected plan 'premium', got '{status.get('plan')}'"
        assert status.get('label') == 'Premium', f"Expected label 'Premium', got '{status.get('label')}'"
        
        print("\nSUCCESS: Verification passed!")
        
    except User.DoesNotExist:
        print(f"ERROR: User {demo_email} not found. Please ensure demo data is seeded.")
    except Exception as e:
        print(f"ERROR: {str(e)}")

if __name__ == "__main__":
    test_demo_user_status()
