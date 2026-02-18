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
    
    # Fallback to free plan from DB if not set
    from users.models import SubscriptionPlan
    free_plan = SubscriptionPlan.objects.filter(name='free').first()
    return free_plan


def check_invoice_limit(user, business):
    """Check if user can create a new invoice this month."""
    plan = get_plan_limits(user)
    if not plan:
        return {'allowed': True, 'current': 0, 'limit': None} # Should not happen

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


def check_client_limit(user):
    """Check if user can create a new client."""
    plan = get_plan_limits(user)
    if not plan:
        return {'allowed': True, 'current': 0, 'limit': None}

    max_clients = plan.clients_limit
    
    if max_clients is None:
        return {'allowed': True, 'current': 0, 'limit': None}
    
    from clients.models import Client
    # Count clients across all user's businesses
    current_count = Client.objects.filter(
        business__user=user
    ).count()
    
    return {
        'allowed': current_count < max_clients,
        'current': current_count,
        'limit': max_clients
    }


def check_expense_limit(user, business):
    """Check if user can create a new expense this month."""
    plan = get_plan_limits(user)
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


def get_full_plan_status(user):
    """Get complete plan status with all limits and current usage."""
    from invoices.models import Invoice, Expense
    from clients.models import Client
    from users.models import Business
    from users.models import SubscriptionPlan
    
    now = timezone.now()
    plan = get_plan_limits(user)
    if not plan:
        # Fallback to avoid crash
        return {
            'plan': 'free',
            'limits': {},
            'usage': {}
        }
    
    # Get first active business for context
    active_businesses = Business.objects.filter(user=user)
    first_business = active_businesses.first()
    
    # Current usage
    invoices_this_month = 0
    expenses_this_month = 0
    # Usage should probably be aggregated across all businesses or specific to active one
    # Currently use all businesses for total usage check if applicable
    invoices_this_month = Invoice.objects.filter(
        business__user=user,
        created_at__year=now.year,
        created_at__month=now.month
    ).count()
    expenses_this_month = Expense.objects.filter(
        business__user=user,
        date__year=now.year,
        date__month=now.month
    ).count()
    
    total_clients = Client.objects.filter(business__user=user).count()
    total_businesses = active_businesses.count()
    
    return {
        'plan': plan.name,
        'label': plan.label,
        'limits': {
            'invoices_per_month': plan.invoices_per_month,
            'clients': plan.clients_limit,
            'expenses_per_month': plan.expenses_per_month,
            'businesses': plan.businesses_limit,
            'forecast_analytics': plan.has_forecast_analytics,
            'csv_export': plan.has_csv_export,
            'premium_pdf': plan.has_premium_pdf,
            'api_access': plan.has_api_access,
            'team_members': plan.team_members_limit,
            'custom_themes': plan.has_custom_themes,
        },
        'usage': {
            'invoices_this_month': invoices_this_month,
            'clients': total_clients,
            'expenses_this_month': expenses_this_month,
            'businesses': total_businesses,
        }
    }
