"""
Plan limits configuration and enforcement utilities.
Defines resource limits per membership tier and provides
helper functions to check if a user can create new resources.
"""
from django.utils import timezone
from django.db.models import Count


# Plan limits fetched from database


def get_plan_limits(user):
    """Get the limits for a user's current plan from database."""
    if user.subscription_plan:
        return user.subscription_plan
    
    # Handle legacy users who have string membership but no linked plan
    from users.models import SubscriptionPlan
    if hasattr(user, 'membership') and user.membership and user.membership != 'free':
        legacy_plan = SubscriptionPlan.objects.filter(name=user.membership.lower()).first()
        if legacy_plan:
            # Optionally sync it for future
            user.subscription_plan = legacy_plan
            user.save(update_fields=['subscription_plan'])
            return legacy_plan
            
    # Fallback to free plan from DB if not set
    free_plan = SubscriptionPlan.objects.filter(name='free').first()
    return free_plan


def check_invoice_limit(user, business):
    """Check if user can create a new invoice this month."""
    # Always check the plan of the business owner
    owner = business.user
    
    if owner.email == 'demo_user@invoice.az':
        return {'allowed': True, 'current': 0, 'limit': None}

    plan = get_plan_limits(owner)
    if not plan:
        return {'allowed': True, 'current': 0, 'limit': None}

    max_invoices = plan.invoices_per_month
    
    if max_invoices is None:
        return {'allowed': True, 'current': 0, 'limit': None}
    
    from invoices.models import Invoice
    now = timezone.now()
    current_count = Invoice.objects.filter(
        business=business,
        created_at__year=now.year,
        created_at__month=now.month
    ).count()
    
    return {
        'allowed': current_count < max_invoices,
        'current': current_count,
        'limit': max_invoices
    }


def check_client_limit(user, business=None):
    """
    Check if user can create a new client.
    If business is provided, check the plan of that business owner.
    """
    owner = user
    if business:
        owner = business.user

    if owner.email == 'demo_user@invoice.az':
        return {'allowed': True, 'current': 0, 'limit': None}

    plan = get_plan_limits(owner)
    if not plan:
        return {'allowed': True, 'current': 0, 'limit': None}

    max_clients = plan.clients_limit
    
    if max_clients is None:
        return {'allowed': True, 'current': 0, 'limit': None}
    
    from clients.models import Client
    # Count clients belonging to this owner's businesses
    if business:
        current_count = Client.objects.filter(business=business).count()
    else:
        current_count = Client.objects.filter(business__user=owner).count()
    
    return {
        'allowed': current_count < max_clients,
        'current': current_count,
        'limit': max_clients
    }


def check_expense_limit(user, business):
    """Check if user can create a new expense this month."""
    # Always check the plan of the business owner
    owner = business.user
    
    if owner.email == 'demo_user@invoice.az':
        return {'allowed': True, 'current': 0, 'limit': None}

    plan = get_plan_limits(owner)
    if not plan:
        return {'allowed': True, 'current': 0, 'limit': None}

    max_expenses = plan.expenses_per_month
    
    if max_expenses is None:
        return {'allowed': True, 'current': 0, 'limit': None}
    
    from invoices.models import Expense
    now = timezone.now()
    current_count = Expense.objects.filter(
        business=business,
        date__year=now.year,
        date__month=now.month
    ).count()
    
    return {
        'allowed': current_count < max_expenses,
        'current': current_count,
        'limit': max_expenses
    }


def check_business_limit(user):
    """Check if user can create a new business profile."""
    if user.email == 'demo_user@invoice.az':
        return {'allowed': True, 'current': 0, 'limit': None}

    plan = get_plan_limits(user)
    if not plan:
        return {'allowed': True, 'current': 0, 'limit': None}

    max_businesses = plan.businesses_limit
    
    if max_businesses is None:
        return {'allowed': True, 'current': 0, 'limit': None}
    
    from users.models import Business
    current_count = Business.objects.filter(user=user).count()
    
    return {
        'allowed': current_count < max_businesses,
        'current': current_count,
        'limit': max_businesses
    }


def get_full_plan_status(user, business_id=None):
    """Get complete plan status with all limits and current usage."""
    from invoices.models import Invoice, Expense
    from clients.models import Client
    from users.models import Business, TeamMember
    from users.models import SubscriptionPlan
    
    now = timezone.now()
    
    # Detect organization owner
    organization_owner = user
    
    if business_id:
        try:
            business = Business.objects.filter(id=business_id).first()
            if business:
                organization_owner = business.user
        except (ValueError, TypeError):
            pass
    else:
        # Fallback for when business_id is not provided
        membership = TeamMember.objects.filter(user=user).first()
        if membership:
            organization_owner = membership.owner
        
    plan = get_plan_limits(organization_owner)
    if not plan:
        # Fallback to avoid crash
        return {
            'plan': 'free',
            'limits': {},
            'usage': {}
        }
    
    # Get first active business for context
    active_businesses = Business.objects.filter(user=organization_owner)
    first_business = active_businesses.first()
    
    # Current usage
    invoices_this_month = 0
    expenses_this_month = 0
    # Usage should probably be aggregated across all businesses or specific to active one
    # Currently use all businesses for total usage check if applicable
    invoices_this_month = Invoice.objects.filter(
        business__user=organization_owner,
        created_at__year=now.year,
        created_at__month=now.month
    ).count()
    expenses_this_month = Expense.objects.filter(
        business__user=organization_owner,
        date__year=now.year,
        date__month=now.month
    ).count()
    
    total_clients = Client.objects.filter(business__user=organization_owner).count()
    total_businesses = active_businesses.count()
    
    is_demo = user.email == 'demo_user@invoice.az'
    
    return {
        'plan': 'pro' if is_demo else plan.name,
        'label': 'Professional (Demo)' if is_demo else plan.label,
        'limits': {
            'invoices_per_month': None if is_demo else (plan.invoices_per_month if plan else 0),
            'clients': None if is_demo else (plan.clients_limit if plan else 0),
            'expenses_per_month': None if is_demo else (plan.expenses_per_month if plan else 0),
            'businesses': None if is_demo else (plan.businesses_limit if plan else 1),
            'forecast_analytics': True if is_demo else (plan.has_forecast_analytics if plan else False),
            'csv_export': True if is_demo else (plan.has_csv_export if plan else False),
            'premium_pdf': True if is_demo else (plan.has_premium_pdf if plan else False),
            'api_access': True if is_demo else (plan.has_api_access if plan else False),
            'team_members': 99 if is_demo else (plan.team_members_limit if plan else 0),
            'custom_themes': True if is_demo else (plan.has_custom_themes if plan else False),
        },
        'usage': {
            'invoices_this_month': invoices_this_month,
            'clients': total_clients,
            'expenses_this_month': expenses_this_month,
            'businesses': total_businesses,
        }
    }
