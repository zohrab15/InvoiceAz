from django.core.management.base import BaseCommand
from users.models import User, Business
import time

class Command(BaseCommand):
    help = 'Updates demo user media URLs with high-stability absolute paths'

    def handle(self, *args, **options):
        timestamp = int(time.time())
        email = 'demo_user@invoice.az'
        try:
            user = User.objects.get(email=email)
            # High-quality woman headshot from Unsplash with timestamp to bust cache
            user.avatar = f'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200&h=200&t={timestamp}'
            user.save()
            self.stdout.write(self.style.SUCCESS(f"Updated avatar for user: {user.email}"))
            
            business = Business.objects.filter(user=user).first()
            if business:
                # Logo with timestamp to bust cache
                business.logo = f'https://dummyimage.com/500x500/0f172a/ffffff.png?text=MS&t={timestamp}'
                business.save()
                self.stdout.write(self.style.SUCCESS(f"Updated logo for business: {business.name}"))
            else:
                self.stdout.write(self.style.WARNING("No business found for demo user"))
                
        except User.DoesNotExist:
            self.stdout.write(self.style.ERROR("Demo user not found"))
