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


def _log_stock_movement(product, quantity, movement_type, source_id, note=''):
    """Helper to create a StockMovement record."""
    from inventory.models import StockMovement
    try:
        business = product.business
        stock_before = product.stock_quantity

        if movement_type in ('IN', 'RETURN'):
            stock_after = stock_before + quantity
        else:
            stock_after = stock_before - quantity

        StockMovement.objects.create(
            business=business,
            product=product,
            warehouse=product.warehouse,
            movement_type=movement_type,
            source_type='INVOICE',
            source_id=source_id,
            quantity=abs(quantity),
            unit_cost=product.cost_price or 0,
            stock_before=stock_before,
            stock_after=stock_after,
            note=note
        )
    except Exception:
        pass  # Don't break invoice flow if logging fails


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

    invoice_id = instance.invoice_id if hasattr(instance, 'invoice_id') else None

    # Case 1: Freshly created (and not deleted)
    if created:
        if not instance.is_deleted and instance.product_id:
            Product.objects.filter(pk=instance.product_id).update(
                stock_quantity=F('stock_quantity') - instance.quantity
            )
            # Log movement
            try:
                product = Product.objects.get(pk=instance.product_id)
                _log_stock_movement(
                    product, instance.quantity, 'OUT', invoice_id,
                    f'Faktura satışı (yeni sətir)'
                )
            except Product.DoesNotExist:
                pass
        return

    # Case 2: Soft deletion (was active, now deleted)
    if instance.is_deleted and not old_is_deleted:
        if old_product_id:
            Product.objects.filter(pk=old_product_id).update(
                stock_quantity=F('stock_quantity') + old_qty
            )
            try:
                product = Product.objects.get(pk=old_product_id)
                _log_stock_movement(
                    product, old_qty, 'RETURN', invoice_id,
                    f'Faktura sətri silindi (stok geri qaytarıldı)'
                )
            except Product.DoesNotExist:
                pass
        return

    # Case 3: Restoration (was deleted, now active)
    if not instance.is_deleted and old_is_deleted:
        if instance.product_id:
            Product.objects.filter(pk=instance.product_id).update(
                stock_quantity=F('stock_quantity') - instance.quantity
            )
            try:
                product = Product.objects.get(pk=instance.product_id)
                _log_stock_movement(
                    product, instance.quantity, 'OUT', invoice_id,
                    f'Faktura sətri bərpa edildi'
                )
            except Product.DoesNotExist:
                pass
        return

    # Case 4: Standard update (both active)
    if not instance.is_deleted and not old_is_deleted:
        # Product swapped
        if old_product_id != instance.product_id:
            if old_product_id:
                Product.objects.filter(pk=old_product_id).update(
                    stock_quantity=F('stock_quantity') + old_qty
                )
                try:
                    old_product = Product.objects.get(pk=old_product_id)
                    _log_stock_movement(
                        old_product, old_qty, 'RETURN', invoice_id,
                        f'Məhsul dəyişdirildi (köhnə məhsulun stoku bərpa edildi)'
                    )
                except Product.DoesNotExist:
                    pass
            if instance.product_id:
                Product.objects.filter(pk=instance.product_id).update(
                    stock_quantity=F('stock_quantity') - instance.quantity
                )
                try:
                    product = Product.objects.get(pk=instance.product_id)
                    _log_stock_movement(
                        product, instance.quantity, 'OUT', invoice_id,
                        f'Məhsul dəyişdirildi (yeni məhsulun stoku azaldıldı)'
                    )
                except Product.DoesNotExist:
                    pass
        # Same product, quantity changed
        elif instance.product_id and old_qty != instance.quantity:
            delta = instance.quantity - old_qty
            Product.objects.filter(pk=instance.product_id).update(
                stock_quantity=F('stock_quantity') - delta
            )
            try:
                product = Product.objects.get(pk=instance.product_id)
                if delta > 0:
                    _log_stock_movement(
                        product, abs(delta), 'OUT', invoice_id,
                        f'Faktura miqdarı artırıldı (+{delta})'
                    )
                else:
                    _log_stock_movement(
                        product, abs(delta), 'RETURN', invoice_id,
                        f'Faktura miqdarı azaldıldı ({delta})'
                    )
            except Product.DoesNotExist:
                pass


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
        try:
            product = Product.objects.get(pk=instance.product_id)
            invoice_id = instance.invoice_id if hasattr(instance, 'invoice_id') else None
            _log_stock_movement(
                product, instance.quantity, 'RETURN', invoice_id,
                f'Faktura sətri tamamilə silindi (hard delete)'
            )
        except Product.DoesNotExist:
            pass
