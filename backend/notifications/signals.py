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
            title="Yeni Biznes Profili",
            message=f"'{instance.name}' adlı biznes profili uğurla yaradıldı.",
            type='success'
        )

@receiver(post_save, sender=Client)
def client_created(sender, instance, created, **kwargs):
    if created:
        create_notification(
            user=instance.business.user,
            title="Yeni Müştəri",
            message=f"'{instance.name}' adlı yeni müştəri əlavə edildi.",
            type='info',
            setting_key='client_created'
        )

@receiver(post_save, sender=Invoice)
def invoice_created(sender, instance, created, **kwargs):
    if created:
        create_notification(
            user=instance.business.user,
            title="Yeni Faktura",
            message=f"#{instance.invoice_number} nömrəli yeni faktura yaradıldı.",
            type='info',
            link={ 'path': '/invoices', 'id': instance.id },
            setting_key='invoice_created'
        )

@receiver(post_save, sender=Payment)
def payment_received(sender, instance, created, **kwargs):
    if created:
        create_notification(
            user=instance.invoice.business.user,
            title="Yeni Ödəniş",
            message=f"#{instance.invoice.invoice_number} nömrəli faktura üzrə {instance.amount} AZN ödəniş qəbul edildi.",
            type='success',
            link={ 'path': '/invoices' },
            setting_key='payment_received'
        )
