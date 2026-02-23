from django.core.management.base import BaseCommand
from notifications.models import Notification

class Command(BaseCommand):
    help = 'Categorizes legacy notifications based on their title and message'

    def handle(self, *args, **options):
        # 1. Stocks
        inventory_keywords = ['stok', 'məhsul', 'miqdar', 'low stock', 'inventory']
        stock_notifications = Notification.objects.filter(category__isnull=True)
        
        count = 0
        for notif in stock_notifications:
            title_lower = (notif.title or '').lower()
            message_lower = (notif.message or '').lower()
            
            is_inventory = False
            if 'stok' in title_lower or 'limit' in title_lower:
                is_inventory = True
            
            if is_inventory:
                notif.category = 'inventory'
                notif.save()
                count += 1
        
        self.stdout.write(self.style.SUCCESS(f'Successfully categorized {count} inventory notifications'))

        # 2. Finance
        finance_keywords = ['faktura', 'ödəniş', 'xərc', 'invoice', 'payment', 'expense']
        finance_notifications = Notification.objects.filter(category__isnull=True)
        
        count_fin = 0
        for notif in finance_notifications:
            title_lower = (notif.title or '').lower()
            
            is_finance = False
            for kw in finance_keywords:
                if kw in title_lower:
                    is_finance = True
                    break
            
            if is_finance:
                notif.category = 'finance'
                notif.save()
                count_fin += 1
        
        self.stdout.write(self.style.SUCCESS(f'Successfully categorized {count_fin} finance notifications'))
