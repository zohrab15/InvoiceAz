from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from users.models import Business
from clients.models import Client
from invoices.models import Invoice, Payment, Expense
from inventory.models import Product
from .utils import create_notification
from .models import ActivityLog
from .middleware import get_current_user

@receiver(post_save, sender=Business)
def business_created(sender, instance, created, **kwargs):
    if created:
        create_notification(
            user=instance.user,
            business=instance,
            title="Yeni Biznes Profili",
            message=f"'{instance.name}' adlı biznes profili uğurla yaradıldı.",
            type='success',
            category='system'
        )

@receiver(post_save, sender=Client)
def client_created(sender, instance, created, **kwargs):
    if created:
        create_notification(
            user=instance.business.user,
            business=instance.business,
            title="Yeni Müştəri",
            message=f"'{instance.name}' adlı yeni müştəri əlavə edildi.",
            type='info',
            setting_key='client_created',
            category='clients'
        )
        if instance.assigned_to:
            create_notification(
                user=instance.assigned_to,
                business=instance.business,
                title="Sizə Müştəri Təyin Edildi",
                message=f"'{instance.name}' adlı yeni müştəri sizə təyin edildi.",
                type='info',
                setting_key='client_created',
                category='clients'
            )

@receiver(post_save, sender=Invoice)
def invoice_created(sender, instance, created, **kwargs):
    if created:
        create_notification(
            user=instance.business.user,
            business=instance.business,
            title="Yeni Faktura",
            message=f"#{instance.invoice_number} nömrəli yeni faktura yaradıldı.",
            type='info',
            link='/invoices',
            setting_key='invoice_created',
            category='finance'
        )
        if instance.client and instance.client.assigned_to:
            create_notification(
                user=instance.client.assigned_to,
                business=instance.business,
                title="Yeni Faktura Yaradıldı",
                message=f"Müştəriniz {instance.client.name} üçün #{instance.invoice_number} nömrəli yeni faktura yaradıldı.",
                type='info',
                link='/invoices',
                setting_key='invoice_created',
                category='finance'
            )

@receiver(post_save, sender=Payment)
def payment_received(sender, instance, created, **kwargs):
    if created:
        create_notification(
            user=instance.invoice.business.user,
            business=instance.invoice.business,
            title="Yeni Ödəniş",
            message=f"#{instance.invoice.invoice_number} nömrəli faktura üzrə {instance.amount:.2f} AZN ödəniş qəbul edildi.",
            type='success',
            link='/invoices',
            setting_key='payment_received',
            category='finance'
        )
        if instance.invoice.client and instance.invoice.client.assigned_to:
            create_notification(
                user=instance.invoice.client.assigned_to,
                business=instance.invoice.business,
                title="Yeni Ödəniş",
                message=f"Müştəriniz {instance.invoice.client.name} tərəfindən #{instance.invoice.invoice_number} nömrəli faktura üzrə {instance.amount:.2f} AZN ödəniş qəbul edildi.",
                type='success',
                link='/invoices',
                setting_key='payment_received',
                category='finance'
            )

# ============================================================
# AUDIT TRAIL / ACTIVITY LOGGING SIGNALS
# ============================================================

def _log(business, action, module, description):
    try:
        user = get_current_user()
        if not user or getattr(user, 'is_anonymous', True):
            return
            
        # Unwrap SimpleLazyObject just to be 100% safe
        if hasattr(user, '_wrapped') and hasattr(user, '_setup'):
            import django
            if user._wrapped is django.utils.functional.empty:
                user._setup()
            if hasattr(user, '_wrapped') and user._wrapped is not django.utils.functional.empty:
                user = user._wrapped
            
        user_role = None
        if business and user:
            from users.models import TeamMember
            try:
                member = TeamMember.objects.filter(owner=business.user, user=user).first()
                if member:
                    user_role = member.role
            except Exception:
                pass
                
            if not user_role and hasattr(business, 'user') and user == business.user:
                user_role = 'OWNER'
                    
        from django.db import transaction
        with transaction.atomic():
            # FINAL SAFETY CHECK: Ensure user exists in DB to avoid ForeignKeyViolation in tests
            from django.contrib.auth import get_user_model
            User = get_user_model()
            if not User.objects.filter(id=user.id).exists():
                return

            ActivityLog.objects.create(
                business=business,
                user=user,
                user_role=user_role,
                action=action,
                module=module,
                description=description
            )
    except Exception as e:
        # Silently fail if logging fails - don't break the main transaction
        pass

# --------- INVOICE ---------
@receiver(post_save, sender=Invoice)
def log_invoice_save(sender, instance, created, **kwargs):
    business = instance.business
    if created:
        _log(business, 'CREATE', 'INVOICE', f"#{instance.invoice_number} nömrəli faktura yaradıldı.")
    else:
        _log(business, 'UPDATE', 'INVOICE', f"#{instance.invoice_number} nömrəli faktura yeniləndi.")

@receiver(post_delete, sender=Invoice)
def log_invoice_delete(sender, instance, **kwargs):
    _log(instance.business, 'DELETE', 'INVOICE', f"#{instance.invoice_number} nömrəli faktura silindi.")


# --------- EXPENSE ---------
@receiver(post_save, sender=Expense)
def log_expense_save(sender, instance, created, **kwargs):
    business = getattr(instance, 'business', None)
    if not business:
         return
    if created:
        _log(business, 'CREATE', 'EXPENSE', f"{instance.amount} AZN dəyərində xərc əlavə edildi ({instance.category}).")
    else:
        _log(business, 'UPDATE', 'EXPENSE', f"Xərc yeniləndi ({instance.category}).")

@receiver(post_delete, sender=Expense)
def log_expense_delete(sender, instance, **kwargs):
    business = getattr(instance, 'business', None)
    if business:
       _log(business, 'DELETE', 'EXPENSE', f"{instance.amount} AZN dəyərində xərc silindi ({instance.category}).")


# --------- PAYMENT ---------
@receiver(post_save, sender=Payment)
def log_payment_save(sender, instance, created, **kwargs):
    if created:
        _log(instance.invoice.business, 'CREATE', 'PAYMENT', f"#{instance.invoice.invoice_number} üçün {instance.amount} AZN ödəniş qəbul edildi.")


# --------- CLIENT ---------
@receiver(post_save, sender=Client)
def log_client_save(sender, instance, created, **kwargs):
    if created:
        _log(instance.business, 'CREATE', 'CLIENT', f"'{instance.name}' adlı yeni müştəri yaradıldı.")
    else:
        _log(instance.business, 'UPDATE', 'CLIENT', f"'{instance.name}' müştərisi yeniləndi.")

@receiver(post_delete, sender=Client)
def log_client_delete(sender, instance, **kwargs):
    _log(instance.business, 'DELETE', 'CLIENT', f"'{instance.name}' müştərisi silindi.")


# --------- PRODUCT ---------
@receiver(post_save, sender=Product)
def log_product_save(sender, instance, created, **kwargs):
    if created:
        _log(instance.business, 'CREATE', 'PRODUCT', f"'{instance.name}' adlı məhsul anbara əlavə edildi.")
    else:
        _log(instance.business, 'UPDATE', 'PRODUCT', f"'{instance.name}' məhsulu yeniləndi.")

@receiver(post_delete, sender=Product)
def log_product_delete(sender, instance, **kwargs):
    _log(instance.business, 'DELETE', 'PRODUCT', f"'{instance.name}' məhsulu silindi.")
