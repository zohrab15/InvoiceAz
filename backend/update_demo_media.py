import os
import django
import sys

# Setup Django environment
sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from users.models import User, Business

def update_media():
    email = 'demo_user@invoice.az'
    try:
        user = User.objects.get(email=email)
        user.avatar = 'avatars/demo_avatar.jpg'
        user.save()
        print(f"Updated avatar for user: {user.email}")
        
        business = Business.objects.filter(user=user).first()
        if business:
            business.logo = 'logos/demo_logo.png'
            business.save()
            print(f"Updated logo for business: {business.name}")
        else:
            print("No business found for demo user")
            
    except User.DoesNotExist:
        print("User not found")

if __name__ == "__main__":
    update_media()
