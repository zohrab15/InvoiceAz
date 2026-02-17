from django.core.management.base import BaseCommand
from users.models import User, Business

class Command(BaseCommand):
    help = 'Updates demo user media URLs with high-stability absolute paths'

    def handle(self, *args, **options):
        email = 'demo_user@invoice.az'
        try:
            user = User.objects.get(email=email)
            user.avatar = 'https://ui-avatars.com/api/?name=Zohrab+Demo&background=3b82f6&color=fff'
            user.save()
            self.stdout.write(self.style.SUCCESS(f"Updated avatar for user: {user.email}"))
            
            business = Business.objects.filter(user=user).first()
            if business:
                business.logo = 'https://dummyimage.com/500x500/0f172a/ffffff.png?text=MS'
                business.save()
                self.stdout.write(self.style.SUCCESS(f"Updated logo for business: {business.name}"))
            else:
                self.stdout.write(self.style.WARNING("No business found for demo user"))
                
        except User.DoesNotExist:
            self.stdout.write(self.style.ERROR("Demo user not found"))
