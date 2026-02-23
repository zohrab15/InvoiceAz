from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Product
from notifications.utils import create_notification
from users.models import TeamMember

@receiver(post_save, sender=Product)
def check_low_stock(sender, instance, **kwargs):
    """
    Signal to check if stock level is low and send notifications.
    """
    if instance.stock_quantity <= instance.min_stock_level:
        business = instance.business
        owner = business.user
        
        title = "Kritik Stok Xəbərdarlığı"
        message = f"'{instance.name}' (SKU: {instance.sku}) məhsulunun stoku azalıb: {instance.stock_quantity} {instance.unit} (Limit: {instance.min_stock_level})"
        link = f"/products?search={instance.sku}" if instance.sku else "/products"
        
        # 1. Notify Owner
        create_notification(
            user=owner,
            business=business,
            title=title,
            message=message,
            type='warning',
            link=link,
            setting_key='low_stock',
            category='inventory'
        )
        
        # 2. Notify Inventory Managers and Managers in the team
        team_members = TeamMember.objects.filter(
            owner=owner,
            role__in=['INVENTORY_MANAGER', 'MANAGER']
        )
        
        for tm in team_members:
            create_notification(
                user=tm.user,
                business=business,
                title=title,
                message=message,
                type='warning',
                link=link,
                setting_key='low_stock',
                category='inventory'
            )
