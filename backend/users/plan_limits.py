"""
Plan limits configuration and enforcement utilities.
Defines resource limits per membership tier and provides
helper functions to check if a user can create new resources.
"""
import os
from django.conf import settings
from django.utils import timezone
from django.db.models import Count


def get_plan_limits(user):
    """Get the limits for a user's current plan from database."""
    if user.subscription_plan:
        return user.subscription_plan

    # Try to find plan based on membership string (legacy fallback)
    if hasattr(user, 'membership') and user.membership:
        from users.models import SubscriptionPlan
        plan = SubscriptionPlan.objects.filter(name=user.membership.lower()).first()
        if plan:
            return plan

    # Fallback to free plan from DB if not set
    from users.models import SubscriptionPlan
    free_plan = SubscriptionPlan.objects.filter(name='free').first()
    return free_plan


def _check_limit(plan_value, current_count):
    """Generic limit check. None = unlimited."""
    if plan_value is None:
        return {'allowed': True, 'current': current_count, 'limit': None}
    return {
        'allowed': current_count < plan_value,
        'current': current_count,
        'limit': plan_value,
    }


def _get_owner(user, business=None):
    """Get the business owner (plan is always checked against owner)."""
    if business:
        return business.user
    return user


def _is_demo(user):
    return user.email == 'demo_user@invoice.az'


def check_invoice_limit(user, business):
    """Check if user can create a new invoice this month."""
    owner = _get_owner(user, business)
    if _is_demo(owner):
        return {'allowed': True, 'current': 0, 'limit': None}

    plan = get_plan_limits(owner)
    if not plan:
        return {'allowed': True, 'current': 0, 'limit': None}

    from invoices.models import Invoice
    now = timezone.now()
    current_count = Invoice.all_objects.filter(
        business=business,
        created_at__year=now.year,
        created_at__month=now.month
    ).count()
    return _check_limit(plan.invoices_per_month, current_count)


def check_client_limit(user, business=None):
    """Check if user can create a new client."""
    owner = _get_owner(user, business)
    if _is_demo(owner):
        return {'allowed': True, 'current': 0, 'limit': None}

    plan = get_plan_limits(owner)
    if not plan:
        return {'allowed': True, 'current': 0, 'limit': None}

    from clients.models import Client
    if business:
        current_count = Client.objects.filter(business=business).count()
    else:
        current_count = Client.objects.filter(business__user=owner).count()
    return _check_limit(plan.clients_limit, current_count)


def check_expense_limit(user, business):
    """Check if user can create a new expense this month."""
    owner = _get_owner(user, business)
    if _is_demo(owner):
        return {'allowed': True, 'current': 0, 'limit': None}

    plan = get_plan_limits(owner)
    if not plan:
        return {'allowed': True, 'current': 0, 'limit': None}

    from invoices.models import Expense
    now = timezone.now()
    current_count = Expense.all_objects.filter(
        business=business,
        date__year=now.year,
        date__month=now.month
    ).count()
    return _check_limit(plan.expenses_per_month, current_count)


def check_business_limit(user):
    """Check if user can create a new business profile."""
    if _is_demo(user):
        return {'allowed': True, 'current': 0, 'limit': None}

    plan = get_plan_limits(user)
    if not plan:
        return {'allowed': True, 'current': 0, 'limit': None}

    from users.models import Business
    current_count = Business.objects.filter(user=user).count()
    return _check_limit(plan.businesses_limit, current_count)


def check_product_limit(user, business):
    """Check if user can create a new product."""
    owner = _get_owner(user, business)
    if _is_demo(owner):
        return {'allowed': True, 'current': 0, 'limit': None}

    plan = get_plan_limits(owner)
    if not plan:
        return {'allowed': True, 'current': 0, 'limit': None}

    from inventory.models import Product
    current_count = Product.objects.filter(business=business).count()
    return _check_limit(plan.products_limit, current_count)


def check_warehouse_limit(user, business):
    """Check if user can create a new warehouse."""
    owner = _get_owner(user, business)
    if _is_demo(owner):
        return {'allowed': True, 'current': 0, 'limit': None}

    plan = get_plan_limits(owner)
    if not plan:
        return {'allowed': True, 'current': 0, 'limit': None}

    from inventory.models import Warehouse
    current_count = Warehouse.objects.filter(business=business).count()
    return _check_limit(plan.warehouses_limit, current_count)


def check_purchase_order_limit(user, business):
    """Check if user can create a new purchase order this month."""
    owner = _get_owner(user, business)
    if _is_demo(owner):
        return {'allowed': True, 'current': 0, 'limit': None}

    plan = get_plan_limits(owner)
    if not plan:
        return {'allowed': True, 'current': 0, 'limit': None}

    from inventory.models import PurchaseOrder
    now = timezone.now()
    current_count = PurchaseOrder.objects.filter(
        business=business,
        created_at__year=now.year,
        created_at__month=now.month
    ).count()
    return _check_limit(plan.purchase_orders_per_month, current_count)


def check_team_member_limit(user, business=None):
    """Check if user can add a new team member."""
    if _is_demo(user):
        return {'allowed': True, 'current': 0, 'limit': None}

    plan = get_plan_limits(user)
    if not plan:
        return {'allowed': True, 'current': 0, 'limit': None}

    from users.models import TeamMember
    current_count = TeamMember.objects.filter(owner=user).count()
    return _check_limit(plan.team_members_limit, current_count)


def calculate_storage_usage_mb(user):
    """Calculate total storage used by a user across all file fields (in MB)."""
    from users.models import Business
    from invoices.models import Invoice, Payment, Expense

    total_bytes = 0
    media_root = str(settings.MEDIA_ROOT)

    def _file_size(file_field):
        """Get file size in bytes, handling missing files gracefully."""
        if not file_field:
            return 0
        try:
            path = os.path.join(media_root, str(file_field))
            if os.path.isfile(path):
                return os.path.getsize(path)
        except (OSError, ValueError):
            pass
        return 0

    # User avatar
    total_bytes += _file_size(user.avatar)

    # Business logos
    businesses = Business.objects.filter(user=user)
    for biz in businesses:
        total_bytes += _file_size(biz.logo)

    # Invoice PDFs
    for pdf in Invoice.objects.filter(business__user=user).exclude(pdf_file='').exclude(pdf_file__isnull=True).values_list('pdf_file', flat=True):
        total_bytes += _file_size(pdf)

    # Payment receipts
    for receipt in Payment.objects.filter(invoice__business__user=user).exclude(receipt_file='').exclude(receipt_file__isnull=True).values_list('receipt_file', flat=True):
        total_bytes += _file_size(receipt)

    # Expense attachments
    for attachment in Expense.objects.filter(business__user=user).exclude(attachment='').exclude(attachment__isnull=True).values_list('attachment', flat=True):
        total_bytes += _file_size(attachment)

    return round(total_bytes / (1024 * 1024), 2)


def check_storage_limit(user, additional_bytes=0):
    """Check if user has storage space available. additional_bytes = size of new file being uploaded."""
    if _is_demo(user):
        return {'allowed': True, 'current_mb': 0, 'limit_mb': None}

    plan = get_plan_limits(user)
    if not plan:
        return {'allowed': True, 'current_mb': 0, 'limit_mb': None}

    if plan.storage_limit_mb is None:
        current = calculate_storage_usage_mb(user)
        return {'allowed': True, 'current_mb': current, 'limit_mb': None}

    current_mb = calculate_storage_usage_mb(user)
    additional_mb = additional_bytes / (1024 * 1024)
    return {
        'allowed': (current_mb + additional_mb) <= plan.storage_limit_mb,
        'current_mb': current_mb,
        'limit_mb': plan.storage_limit_mb,
    }


def check_feature(user, feature_name, business=None):
    """Generic boolean feature check. Returns True/False."""
    owner = _get_owner(user, business)
    if _is_demo(owner) or owner.is_superuser or owner.is_staff:
        return True

    plan = get_plan_limits(owner)
    if not plan:
        return False

    return getattr(plan, feature_name, False)


def get_full_plan_status(user, business_id=None):
    """Get complete plan status with all limits and current usage."""
    from invoices.models import Invoice, Expense
    from clients.models import Client
    from users.models import Business, SubscriptionPlan, TeamMember
    from inventory.models import Product, Warehouse, PurchaseOrder

    now = timezone.now()

    # Detect organization owner
    organization_owner = user
    selected_business = None

    if business_id:
        try:
            selected_business = Business.objects.filter(id=business_id).first()
            if selected_business:
                organization_owner = selected_business.user
        except (ValueError, TypeError, Business.DoesNotExist):
            pass

    if not selected_business:
        membership = TeamMember.objects.filter(user=user).select_related('owner').first()
        if membership:
            organization_owner = membership.owner

    plan = get_plan_limits(organization_owner)
    if not plan:
        return {
            'plan': 'free',
            'limits': {},
            'usage': {}
        }

    active_businesses = Business.objects.filter(user=organization_owner)

    # Current usage
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
    purchase_orders_this_month = PurchaseOrder.objects.filter(
        business__user=organization_owner,
        created_at__year=now.year,
        created_at__month=now.month
    ).count()

    total_clients = Client.objects.filter(business__user=organization_owner).count()
    total_businesses = active_businesses.count()
    total_products = Product.objects.filter(business__user=organization_owner).count()
    total_warehouses = Warehouse.objects.filter(business__user=organization_owner).count()
    total_team_members = TeamMember.objects.filter(owner=organization_owner).count()

    is_demo = user.email == 'demo_user@invoice.az'
    is_privileged = user.is_superuser or user.is_staff or is_demo

    def _val(field_value, override=None):
        """Return None (unlimited) for privileged users, otherwise field value."""
        if is_privileged and override is not None:
            return override
        if is_privileged:
            return None if isinstance(field_value, (int, type(None))) else True
        return field_value

    return {
        'plan': 'pro' if is_privileged else plan.name,
        'label': 'Pro (Privileged)' if (user.is_superuser or user.is_staff) else ('Pro (Demo)' if is_demo else plan.label),
        'subscription': {
            'interval': user.subscription_interval,
            'expiry': user.subscription_expiry.strftime('%Y-%m-%d') if user.subscription_expiry else None,
            'price_monthly': float(plan.price_monthly) if plan else 0,
            'price_yearly': float(plan.price_yearly) if plan else 0,
            'cancel_at_period_end': user.cancel_at_period_end,
        },
        'limits': {
            # Kəmiyyət limitləri
            'invoices_per_month': _val(plan.invoices_per_month),
            'clients': _val(plan.clients_limit),
            'expenses_per_month': _val(plan.expenses_per_month),
            'businesses': _val(plan.businesses_limit),
            'products': _val(plan.products_limit),
            'team_members': _val(plan.team_members_limit) if not is_privileged else 99,
            'warehouses': _val(plan.warehouses_limit),
            'purchase_orders_per_month': _val(plan.purchase_orders_per_month),
            'storage_limit_mb': _val(plan.storage_limit_mb),

            # Faktura xüsusiyyətləri
            'premium_pdf': _val(plan.has_premium_pdf),
            'custom_themes': _val(plan.has_custom_themes),
            'white_label': _val(plan.has_white_label),
            'email_sending': _val(plan.has_email_sending),
            'etag_xml': _val(plan.has_etag_xml),
            'duplicate_invoice': _val(plan.has_duplicate_invoice),
            'public_sharing': _val(plan.has_public_sharing),
            'overdue_reminders': _val(plan.has_overdue_reminders),

            # Analitika
            'forecast_analytics': _val(plan.has_forecast_analytics),
            'csv_export': _val(plan.has_csv_export),
            'payment_analytics': _val(plan.has_payment_analytics),
            'tax_reports': _val(plan.has_tax_reports),
            'client_ratings': _val(plan.has_client_ratings),
            'activity_log': _val(plan.has_activity_log),

            # Komanda & İnventar
            'team_gps': _val(plan.has_team_gps),
            'bulk_operations': _val(plan.has_bulk_operations),
            'stock_alerts': _val(plan.has_stock_alerts),
            'multi_currency': _val(plan.has_multi_currency),

            # Əlavə
            'api_access': _val(plan.has_api_access),
            'vip_support': _val(plan.has_vip_support),
        },
        'usage': {
            'invoices_this_month': invoices_this_month,
            'clients': total_clients,
            'expenses_this_month': expenses_this_month,
            'businesses': total_businesses,
            'products': total_products,
            'warehouses': total_warehouses,
            'team_members': total_team_members,
            'purchase_orders_this_month': purchase_orders_this_month,
            'storage_used_mb': calculate_storage_usage_mb(organization_owner),
        }
    }
