import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from users.models import User, Business, TeamMember, SubscriptionPlan
from users.plan_limits import get_full_plan_status, get_plan_limits

def check_user(email):
    try:
        user = User.objects.get(email=email)
        print(f"--- Checking User: {email} ---")
        print(f"Plan (field): {user.subscription_plan.name if user.subscription_plan else 'None'}")
        print(f"Membership string: {user.membership}")
        
        # Check plan limits result
        plan = get_plan_limits(user)
        print(f"Plan being used: {plan.name if plan else 'None'}")
        print(f"Themes allowed: {plan.has_custom_themes if plan else False}")
        
        # Check business context
        businesses = Business.objects.filter(user=user)
        print(f"Owned businesses: {[b.name for b in businesses]}")
        
        memberships = TeamMember.objects.filter(user=user)
        for m in memberships:
            print(f"Member of: {m.owner.email}'s team (Role: {m.role})")
            owner_plan = get_plan_limits(m.owner)
            print(f"  Owner plan: {owner_plan.name if owner_plan else 'None'}")
            print(f"  Owner themes: {owner_plan.has_custom_themes if owner_plan else False}")
            
        # Overall status
        status = get_full_plan_status(user)
        print(f"Full plan status: {status['plan']} (Label: {status['label']})")
        print(f"Full themes limit: {status['limits'].get('custom_themes')}")
        
    except User.DoesNotExist:
        print(f"User {email} not found")

check_user('admin@invoice.az')
