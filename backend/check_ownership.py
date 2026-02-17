import os
import django
import sys

# Setup Django environment
sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from users.models import User, Business
from invoices.models import Invoice

def check_ownership():
    for user in User.objects.all():
        businesses = Business.objects.filter(user=user)
        inv_count = Invoice.objects.filter(business__user=user).count()
        print(f"User: {user.email} | Businesses: {businesses.count()} | Invoices: {inv_count}")

if __name__ == "__main__":
    check_ownership()
