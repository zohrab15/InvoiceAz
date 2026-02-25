from django.db.models import F
from django.db.models.signals import post_save, post_delete, pre_save
from django.dispatch import receiver
from invoices.models import InvoiceItem

@receiver(pre_save, sender=InvoiceItem)
def capture_old_state(sender, instance, **kwargs):
    """
    Capture the previous state of the invoice item to calculate stock changes.
    """
    if instance.pk:
        try:
            # Use all_objects to include soft-deleted records
            old_instance = InvoiceItem.all_objects.get(pk=instance.pk)
            instance._old_quantity = old_instance.quantity
            instance._old_product_id = old_instance.product_id
            instance._old_is_deleted = old_instance.is_deleted
        except InvoiceItem.DoesNotExist:
            instance._old_quantity = 0
            instance._old_product_id = None
            instance._old_is_deleted = False
    else:
        instance._old_quantity = 0
        instance._old_product_id = None
        instance._old_is_deleted = False

@receiver(post_save, sender=InvoiceItem)
def update_stock_on_save(sender, instance, created, **kwargs):
    """
    Update stock when an InvoiceItem is created, updated, or soft-deleted.
    Using F() expressions to prevent race conditions.
    """
    from inventory.models import Product
    
    old_qty = getattr(instance, '_old_quantity', 0)
    old_product_id = getattr(instance, '_old_product_id', None)
    old_is_deleted = getattr(instance, '_old_is_deleted', False)
    
    # Case 1: Freshly created (and not deleted)
    if created:
        if not instance.is_deleted and instance.product_id:
            Product.objects.filter(pk=instance.product_id).update(
                stock_quantity=F('stock_quantity') - instance.quantity
            )
        return

    # Case 2: Soft deletion (was active, now deleted)
    if instance.is_deleted and not old_is_deleted:
        if old_product_id:
            Product.objects.filter(pk=old_product_id).update(
                stock_quantity=F('stock_quantity') + old_qty
            )
        return

    # Case 3: Restoration (was deleted, now active) - rare but possible
    if not instance.is_deleted and old_is_deleted:
        if instance.product_id:
            Product.objects.filter(pk=instance.product_id).update(
                stock_quantity=F('stock_quantity') - instance.quantity
            )
        return

    # Case 4: Standard update (both active)
    if not instance.is_deleted and not old_is_deleted:
        # Product swapped
        if old_product_id != instance.product_id:
            if old_product_id:
                Product.objects.filter(pk=old_product_id).update(
                    stock_quantity=F('stock_quantity') + old_qty
                )
            if instance.product_id:
                Product.objects.filter(pk=instance.product_id).update(
                    stock_quantity=F('stock_quantity') - instance.quantity
                )
        # Same product, quantity changed
        elif instance.product_id and old_qty != instance.quantity:
            delta = instance.quantity - old_qty
            Product.objects.filter(pk=instance.product_id).update(
                stock_quantity=F('stock_quantity') - delta
            )

@receiver(post_delete, sender=InvoiceItem)
def restore_stock_on_hard_delete(sender, instance, **kwargs):
    """
    Physical deletion also restores stock (backup for hard deletes).
    """
    if not instance.is_deleted and instance.product_id:
        from inventory.models import Product
        Product.objects.filter(pk=instance.product_id).update(
            stock_quantity=F('stock_quantity') + instance.quantity
        )
