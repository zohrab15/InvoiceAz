import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from users.models import User, SubscriptionPlan

try:
    plan = SubscriptionPlan.objects.get(name='Premium')
    user = User.objects.get(email='demo_user@invoice.az')
    user.subscription_plan = plan
    user.membership = 'premium'
    user.save()
    print("Successfully upgraded demo_user@invoice.az to Premium!")
except Exception as e:
    print(f"Error: {e}")
