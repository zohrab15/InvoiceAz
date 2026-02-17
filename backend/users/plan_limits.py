"""
Plan limits configuration and enforcement utilities.
Defines resource limits per membership tier and provides
helper functions to check if a user can create new resources.
"""
from django.utils import timezone
from django.db.models import Count


# Limits per plan
PLAN_LIMITS = {
    'free': {
        'invoices_per_month': 5,
        'clients': 10,
        'expenses_per_month': 20,
        'businesses': 1,
        'forecast_analytics': False,
        'csv_export': False,
        'premium_pdf': False,
        'api_access': False,
        'team_members': 0,
        'custom_themes': False,
    },
    'pro': {
        'invoices_per_month': 100,
        'clients': None,
        'expenses_per_month': None,
        'businesses': 5,
        'forecast_analytics': True,
        'csv_export': True,
        'premium_pdf': True,
        'api_access': False,
        'team_members': 0,
        'custom_themes': False,
    },
    'premium': {
        'invoices_per_month': None,
        'clients': None,
        'expenses_per_month': None,
        'businesses': None,
        'forecast_analytics': True,
        'csv_export': True,
        'premium_pdf': True,
        'api_access': True,
        'team_members': None,
        'custom_themes': True,
    }
}


def get_plan_limits(user):
    """Get the limits dict for a user's current plan."""
    plan = getattr(user, 'membership', 'free') or 'free'
    return PLAN_LIMITS.get(plan, PLAN_LIMITS['free'])


def check_invoice_limit(user, business):
    """Check if user can create a new invoice this month."""
    limits = get_plan_limits(user)
    max_invoices = limits['invoices_per_month']
    
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
    limits = get_plan_limits(user)
    max_clients = limits['clients']
    
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
    limits = get_plan_limits(user)
    max_expenses = limits['expenses_per_month']
    
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
    limits = get_plan_limits(user)
    max_businesses = limits['businesses']
    
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
    
    now = timezone.now()
    plan = getattr(user, 'membership', 'free') or 'free'
    limits = get_plan_limits(user)
    
    # Get first active business for context
    active_businesses = Business.objects.filter(user=user)
    first_business = active_businesses.first()
    
    # Current usage
    invoices_this_month = 0
    expenses_this_month = 0
    if first_business:
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
        'plan': plan,
        'limits': {
            'invoices_per_month': limits['invoices_per_month'],
            'clients': limits['clients'],
            'expenses_per_month': limits['expenses_per_month'],
            'businesses': limits['businesses'],
            'forecast_analytics': limits['forecast_analytics'],
            'csv_export': limits['csv_export'],
            'premium_pdf': limits['premium_pdf'],
            'api_access': limits['api_access'],
            'team_members': limits['team_members'],
            'custom_themes': limits['custom_themes'],
        },
        'usage': {
            'invoices_this_month': invoices_this_month,
            'clients': total_clients,
            'expenses_this_month': expenses_this_month,
            'businesses': total_businesses,
        }
    }
