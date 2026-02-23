from django.db.models.signals import post_save
from django.dispatch import receiver
from users.models import Business
from clients.models import Client
from invoices.models import Invoice, Payment
from .utils import create_notification

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
