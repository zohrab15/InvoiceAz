from django.db.models.signals import post_save, post_delete, pre_save
from django.dispatch import receiver
from invoices.models import InvoiceItem

@receiver(pre_save, sender=InvoiceItem)
def capture_old_quantity(sender, instance, **kwargs):
    """
    Sənəd yadda saxlanılmazdan əvvəl köhnə miqdarı saxla ki, 
    update zamanı fərqi hesablaya bilək.
    """
    if instance.pk:
        try:
            old_instance = InvoiceItem.objects.get(pk=instance.pk)
            instance._old_quantity = old_instance.quantity
            instance._old_product = old_instance.product
        except InvoiceItem.DoesNotExist:
            instance._old_quantity = 0
            instance._old_product = None
    else:
        instance._old_quantity = 0
        instance._old_product = None

@receiver(post_save, sender=InvoiceItem)
def update_stock_on_save(sender, instance, created, **kwargs):
    """
    Yeni InvoiceItem yaradıldıqda və ya redaktə edildikdə stoku yenilə.
    """
    if created:
        if instance.product:
            instance.product.stock_quantity -= instance.quantity
            instance.product.save()
    else:
        old_product = getattr(instance, '_old_product', None)
        old_qty = getattr(instance, '_old_quantity', 0)
        
        # Əgər məhsul eynidirsə, yalnız fərqi çıxırıq
        if old_product and instance.product and old_product.id == instance.product.id:
            delta = instance.quantity - old_qty
            # Update physical object if it's not the same instance in memory
            # or just use F expression for safety, but here we update the instance
            instance.product.stock_quantity -= delta
            instance.product.save()
        else:
            # Məhsul dəyişibsə, köhnəni geri qaytar, yenidən çıx
            if old_product:
                old_product.stock_quantity += old_qty
                old_product.save()
            if instance.product:
                instance.product.stock_quantity -= instance.quantity
                instance.product.save()

@receiver(post_delete, sender=InvoiceItem)
def restore_stock_on_delete(sender, instance, **kwargs):
    """
    Faktura elementi silindikdə miqdarı anbara geri qaytar.
    """
    if instance.product:
        instance.product.stock_quantity += instance.quantity
        instance.product.save()
